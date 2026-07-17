# Console Errors

4 of 57 audited routes produced console output (error/warning level). Every other route produced zero console messages of any kind. Full message text included — nothing summarized or paraphrased.

## `/study/work` (user account — Work (Assignments/Projects))

**console.error:**
```
%o

%s

%s
 Error: Objects are not valid as a React child (found: object with keys {label, onClick}). If you meant to render a collection of children, use an array instead.
    at throwOnInvalidObjectTypeImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3540:10)
    at throwOnInvalidObjectType (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3544:105)
    at createChild (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3643:6)
    at reconcileChildrenArray (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3737:63)
    at reconcileChildFibersImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3842:106)
    at http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3869:28
    at reconcileChildren (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:5386:46)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:6200:1569)
    at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:851:66)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8429:92) The above error occurred in the <div> component. React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
```

**console.error:**
```
[ErrorBoundary] Error: Objects are not valid as a React child (found: object with keys {label, onClick}). If you meant to render a collection of children, use an array instead.
    at throwOnInvalidObjectTypeImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3540:10)
    at throwOnInvalidObjectType (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3544:105)
    at createChild (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3643:6)
    at reconcileChildrenArray (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3737:63)
    at reconcileChildFibersImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3842:106)
    at http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3869:28
    at reconcileChildren (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:5386:46)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:6200:1569)
    at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:851:66)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8429:92) {componentStack: 
    at div (<anonymous>)
    at EmptyState (http:…xt/PWAContext.jsx:15:31)
    at App (<anonymous>)}
```

## `/career/resume` (user account — Resume Builder)

**console.error:**
```
%o

%s

%s
 TypeError: control._getFieldValue is not a function
    at ResumePage (http://localhost:5173/src/pages/ResumePage.jsx:499:27)
    at Object.react_stack_bottom_frame (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:12866:12)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:4213:19)
    at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:5569:16)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:6140:20)
    at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:851:66)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8429:92)
    at workLoopSync (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8325:37)
    at renderRootSync (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8309:6)
    at performWorkOnRoot (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:7994:27) The above error occurred in the <ResumePage> component. React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
```

**console.error:**
```
[ErrorBoundary] TypeError: control._getFieldValue is not a function
    at ResumePage (http://localhost:5173/src/pages/ResumePage.jsx:499:27)
    at Object.react_stack_bottom_frame (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:12866:12)
    at renderWithHooks (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:4213:19)
    at updateFunctionComponent (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:5569:16)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:6140:20)
    at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:851:66)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8429:92)
    at workLoopSync (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8325:37)
    at renderRootSync (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8309:6)
    at performWorkOnRoot (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:7994:27) {componentStack: 
    at ResumePage (http://localhost:5173/src/page…xt/PWAContext.jsx:15:31)
    at App (<anonymous>)}
```

## `/career/questions` (user account — Interview Questions)

**console.error:**
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

**console.error:**
```
Failed to load resource: the server responded with a status of 403 (Forbidden)
```

## `/me/planner` (user account — Planner)

**console.error:**
```
%o

%s

%s
 Error: Objects are not valid as a React child (found: object with keys {label, onClick}). If you meant to render a collection of children, use an array instead.
    at throwOnInvalidObjectTypeImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3540:10)
    at throwOnInvalidObjectType (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3544:105)
    at createChild (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3643:6)
    at reconcileChildrenArray (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3737:63)
    at reconcileChildFibersImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3842:106)
    at http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3869:28
    at reconcileChildren (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:5386:46)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:6200:1569)
    at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:851:66)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8429:92) The above error occurred in the <div> component. React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
```

**console.error:**
```
[ErrorBoundary] Error: Objects are not valid as a React child (found: object with keys {label, onClick}). If you meant to render a collection of children, use an array instead.
    at throwOnInvalidObjectTypeImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3540:10)
    at throwOnInvalidObjectType (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3544:105)
    at createChild (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3643:6)
    at reconcileChildrenArray (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3737:63)
    at reconcileChildFibersImpl (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3842:106)
    at http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:3869:28
    at reconcileChildren (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:5386:46)
    at beginWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:6200:1569)
    at runWithFiberInDEV (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:851:66)
    at performUnitOfWork (http://localhost:5173/node_modules/.vite/deps/react-dom_client.js?v=4394d983:8429:92) {componentStack: 
    at div (<anonymous>)
    at EmptyState (http:…xt/PWAContext.jsx:15:31)
    at App (<anonymous>)}
```

---

_Routes not listed above produced zero console errors or warnings._
