const StudentIdentity = require('../models/StudentIdentity');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');

/**
 * Upsert StudentIdentity from registration payload.
 * Also syncs backward-compatible fields to User and UserProfile.
 */
async function upsertFromRegistration(userId, data) {
  const identityData = {
    user: userId,
    name: data.name || '',
    email: data.email || '',
    rollNumber: data.rollNumber || '',
    college: data.college || '',
    course: data.course || '',
    department: data.department || '',
    specialization: data.specialization || '',
    batch: data.batch || '',
    semester: data.semester || '',
    graduationYear: data.graduationYear || null,
    dreamRole: data.dreamRole || '',
    preferredIndustries: Array.isArray(data.preferredIndustries) ? data.preferredIndustries : [],
    careerInterests: Array.isArray(data.careerInterests) ? data.careerInterests : [],
    favouriteSubjects: Array.isArray(data.favouriteSubjects) ? data.favouriteSubjects : [],
    difficultSubjects: Array.isArray(data.difficultSubjects) ? data.difficultSubjects : [],
    skills: Array.isArray(data.skills) ? data.skills : [],
    learningStyle: StudentIdentity.normalizeLearningStyle(data.learningStyle || ''),
    timeAvailable: data.timeAvailable || '',
    challenges: Array.isArray(data.challenges) ? data.challenges : [],
  };

  // goals: client sends array of strings like ['Placement', 'Skill Building']
  // or subdocument { placement: true } — handle both
  if (Array.isArray(data.goals)) {
    identityData.goals = data.goals;
  } else if (data.goals && typeof data.goals === 'object') {
    identityData.goals = StudentIdentity.goalsSubdocToArray(data.goals);
  } else {
    identityData.goals = [];
  }

  // Experience fields
  if (data.experience && typeof data.experience === 'object') {
    identityData.studentType = data.studentType || 'fresher';
    identityData.workExYears = data.experience.years || null;
    identityData.pastDomain = data.experience.pastDomain || '';
    identityData.priorDomain = data.experience.pastDomain || '';
  } else {
    identityData.studentType = data.studentType || 'fresher';
    identityData.workExYears = data.workExYears || null;
    identityData.pastDomain = data.pastDomain || '';
    identityData.priorDomain = data.priorDomain || '';
  }

  const identity = await StudentIdentity.findOneAndUpdate(
    { user: userId },
    { $set: identityData },
    { upsert: true, new: true, lean: true }
  );

  return identity;
}

/**
 * Sync StudentIdentity → legacy User fields for backward compatibility.
 */
async function syncToUser(userId, identity) {
  if (!identity) {
    identity = await StudentIdentity.findOne({ user: userId }).lean();
  }
  if (!identity) return;

  const userUpdates = {};
  if (identity.bio !== undefined) userUpdates.bio = identity.bio;
  if (identity.linkedin !== undefined) userUpdates.linkedin = identity.linkedin;
  if (identity.github !== undefined) userUpdates.github = identity.github;
  if (identity.studentType !== undefined) userUpdates.studentType = identity.studentType;
  if (identity.workExYears !== undefined) userUpdates.workExYears = identity.workExYears;
  if (identity.name !== undefined) userUpdates.name = identity.name;
  if (identity.rollNumber !== undefined) userUpdates.rollNumber = identity.rollNumber;
  if (identity.interests !== undefined) userUpdates.interests = identity.interests;

  if (Object.keys(userUpdates).length > 0) {
    await User.updateOne({ _id: userId }, { $set: userUpdates });
  }
}

/**
 * Sync StudentIdentity → legacy UserProfile fields for backward compatibility.
 */
async function syncToUserProfile(userId, identity) {
  if (!identity) {
    identity = await StudentIdentity.findOne({ user: userId }).lean();
  }
  if (!identity) return;

  const profileUpdates = {};
  if (identity.skills !== undefined) profileUpdates.skills = identity.skills;
  if (identity.interests !== undefined) profileUpdates.interests = identity.interests;
  if (identity.clubs !== undefined) profileUpdates.clubs = identity.clubs;
  if (identity.languages !== undefined) profileUpdates.languages = identity.languages;
  if (identity.linkedin !== undefined) profileUpdates.linkedin = identity.linkedin;
  if (identity.github !== undefined) profileUpdates.github = identity.github;
  if (identity.portfolio !== undefined) profileUpdates.portfolio = identity.portfolio;
  if (identity.batch !== undefined) profileUpdates.batch = identity.batch;
  if (identity.specialization !== undefined) profileUpdates.specialization = identity.specialization;
  if (identity.bio !== undefined) profileUpdates.bio = identity.bio;
  if (identity.lookingFor !== undefined) profileUpdates.lookingFor = identity.lookingFor;
  if (identity.priorDomain !== undefined) profileUpdates.priorDomain = identity.priorDomain;
  if (identity.college !== undefined) profileUpdates.college = identity.college;
  if (identity.course !== undefined) profileUpdates.course = identity.course;
  if (identity.department !== undefined) profileUpdates.department = identity.department;
  if (identity.semester !== undefined) profileUpdates.semester = identity.semester;
  if (identity.graduationYear !== undefined) profileUpdates.graduationYear = identity.graduationYear;
  if (identity.dreamRole !== undefined) profileUpdates.dreamRole = identity.dreamRole;
  if (identity.preferredIndustries !== undefined) profileUpdates.preferredIndustries = identity.preferredIndustries;
  if (identity.careerInterests !== undefined) profileUpdates.careerInterests = identity.careerInterests;
  if (identity.favouriteSubjects !== undefined) profileUpdates.favouriteSubjects = identity.favouriteSubjects;
  if (identity.difficultSubjects !== undefined) profileUpdates.difficultSubjects = identity.difficultSubjects;
  if (identity.learningStyle !== undefined) profileUpdates.learningStyle = identity.learningStyle || 'Other';

  // goals: convert array to subdocument for backward compat
  if (identity.goals !== undefined) {
    profileUpdates.goals = StudentIdentity.goalsArrayToSubdoc(identity.goals);
  }

  // experience subdocument
  if (identity.workExYears !== undefined || identity.pastDomain !== undefined) {
    const expType = (!identity.workExYears || ['fresher'].includes(identity.studentType)) ? 'fresher' : 'experienced';
    profileUpdates['experience.years'] = identity.workExYears || 0;
    profileUpdates['experience.type'] = expType;
    if (identity.pastDomain !== undefined) {
      profileUpdates['experience.pastDomain'] = identity.pastDomain;
    }
  }
  if (identity.priorDomain !== undefined) {
    profileUpdates.priorDomain = identity.priorDomain;
  }

  if (Object.keys(profileUpdates).length > 0) {
    await UserProfile.updateOne(
      { user: userId },
      { $set: profileUpdates },
      { upsert: true }
    );
  }
}

/**
 * Full sync: StudentIdentity → User + UserProfile.
 */
async function syncToLegacy(userId, identity) {
  await Promise.all([
    syncToUser(userId, identity),
    syncToUserProfile(userId, identity),
  ]);
}

/**
 * Get or create StudentIdentity for a user.
 */
async function getIdentity(userId) {
  let identity = await StudentIdentity.findOne({ user: userId }).lean();
  if (!identity) {
    identity = await bootstrapFromLegacy(userId);
  }
  return identity;
}

/**
 * Bootstrap StudentIdentity from existing User + UserProfile data.
 */
async function bootstrapFromLegacy(userId) {
  const [user, profile] = await Promise.all([
    User.findById(userId).lean(),
    UserProfile.findOne({ user: userId }).lean(),
  ]);
  if (!user) return null;

  const data = {
    user: userId,
    name: user.name || '',
    email: user.email || '',
    rollNumber: user.rollNumber || '',
    avatarUrl: user.avatarUrl || '',
    bio: user.bio || profile?.bio || '',
    linkedin: user.linkedin || profile?.linkedin || '',
    github: user.github || profile?.github || '',
    portfolio: profile?.portfolio || '',
    college: profile?.college || '',
    course: profile?.course || '',
    department: profile?.department || '',
    semester: profile?.semester || '',
    batch: profile?.batch || '',
    graduationYear: profile?.graduationYear || null,
    specialization: profile?.specialization || '',
    studentType: user.studentType || 'fresher',
    workExYears: user.workExYears || null,
    pastDomain: profile?.experience?.pastDomain || '',
    priorDomain: profile?.priorDomain || '',
    lookingFor: profile?.lookingFor || '',
    interests: user.interests || profile?.interests || [],
    skills: profile?.skills || [],
    clubs: profile?.clubs || [],
    languages: profile?.languages || [],
    careerInterests: profile?.careerInterests || [],
    favouriteSubjects: profile?.favouriteSubjects || [],
    difficultSubjects: profile?.difficultSubjects || [],
    preferredIndustries: profile?.preferredIndustries || [],
    dreamRole: profile?.dreamRole || '',
    learningStyle: StudentIdentity.normalizeLearningStyle(
      profile?.learningStyle || ''
    ),
    goals: StudentIdentity.goalsSubdocToArray(profile?.goals),
    timeAvailable: '',
    challenges: [],
    targetCompanies: [],
    targetRoles: [],
  };

  return StudentIdentity.findOneAndUpdate(
    { user: userId },
    { $set: data },
    { upsert: true, new: true, lean: true }
  );
}

/**
 * Update specific fields on StudentIdentity and sync to legacy.
 */
async function updateIdentity(userId, updates) {
  const setFields = {};
  const allowedFields = [
    'name', 'bio', 'linkedin', 'github', 'portfolio',
    'college', 'course', 'department', 'semester', 'batch', 'graduationYear',
    'specialization', 'studentType', 'workExYears', 'pastDomain', 'priorDomain',
    'lookingFor', 'interests', 'skills', 'clubs', 'languages',
    'careerInterests', 'favouriteSubjects', 'difficultSubjects',
    'preferredIndustries', 'dreamRole', 'targetCompanies', 'targetRoles',
    'learningStyle', 'timeAvailable', 'goals', 'challenges',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'learningStyle') {
        setFields[field] = StudentIdentity.normalizeLearningStyle(updates[field]);
      } else if (field === 'goals' && Array.isArray(updates[field])) {
        setFields[field] = updates[field];
      } else {
        setFields[field] = updates[field];
      }
    }
  }

  if (Object.keys(setFields).length === 0) return null;

  const identity = await StudentIdentity.findOneAndUpdate(
    { user: userId },
    { $set: setFields },
    { upsert: true, new: true, lean: true }
  );

  await syncToLegacy(userId, identity);
  return identity;
}

module.exports = {
  upsertFromRegistration,
  syncToUser,
  syncToUserProfile,
  syncToLegacy,
  getIdentity,
  bootstrapFromLegacy,
  updateIdentity,
};
