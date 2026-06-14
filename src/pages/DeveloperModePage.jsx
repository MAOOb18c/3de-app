import UserModePage from "./UserModePage.jsx";

// Staged 25-A boundary: DeveloperModePage is presentation/page-level only.
// App.jsx still owns state, handlers, and prepared diagnostics; item 25-B can
// split diagnostics and dark theme scope more deeply.
export default function DeveloperModePage(props) {
  return <UserModePage {...props} />;
}
