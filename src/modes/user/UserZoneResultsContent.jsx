import Zone12Diagnostics from "../../components/Zone12Diagnostics.jsx";
import { createUserZone12Props } from "./createUserZone12Props.js";
import UserZone8Section from "./UserZone8Section.jsx";
import UserZone9Section from "./UserZone9Section.jsx";

export default function UserZoneResultsContent({ ctx }) {
  return (
    <>
      <UserZone8Section ctx={ctx} />
      <UserZone9Section ctx={ctx} />
      <Zone12Diagnostics {...createUserZone12Props(ctx)} />
    </>
  );
}
