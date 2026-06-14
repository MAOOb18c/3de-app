import UserSidebarIntroSections from "./UserSidebarIntroSections.jsx";
import UserSidebarInputSection from "./UserSidebarInputSection.jsx";
import UserSidebarPurposeSection from "./UserSidebarPurposeSection.jsx";
import UserSidebarAnalysisPurposeSection from "./UserSidebarAnalysisPurposeSection.jsx";
import UserSidebarAxisSection from "./UserSidebarAxisSection.jsx";
import UserSidebarSourceSection from "./UserSidebarSourceSection.jsx";
import UserSidebarHistorySection from "./UserSidebarHistorySection.jsx";
import UserSidebarClusterSection from "./UserSidebarClusterSection.jsx";
import UserSidebarSummarySection from "./UserSidebarSummarySection.jsx";

export default function UserSidebarContent({ ctx, axisSectionProps, searchConditionProps }) {
  return (
    <>
      <UserSidebarIntroSections ctx={ctx} />
      <UserSidebarInputSection ctx={ctx} />
      <UserSidebarPurposeSection ctx={ctx} />
      <UserSidebarAnalysisPurposeSection ctx={ctx} />
      <UserSidebarAxisSection axisSectionProps={axisSectionProps} />
      <UserSidebarSourceSection ctx={ctx} searchConditionProps={searchConditionProps} />
      <UserSidebarHistorySection ctx={ctx} />
      <UserSidebarClusterSection ctx={ctx} />
      <UserSidebarSummarySection ctx={ctx} />
    </>
  );
}
