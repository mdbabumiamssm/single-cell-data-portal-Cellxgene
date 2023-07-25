import { track } from "src/common/analytics";
import { EVENTS } from "src/common/analytics/events";
import BottomBanner from "src/components/BottomBanner";
import { StyledLink } from "src/components/BottomBanner/style";

export default function CellGuideBottomBanner(): JSX.Element {
  return (
    <BottomBanner
      includeSurveyLink
      customSurveyLinkPrefix={
        <span>
          Check out the{" "}
          <StyledLink
            href="https://docs.google.com/document/d/1ljLxEpEpOLwvEpUBsZbNolV0MovkTVb_cHSwIyG0mg8/edit?usp=sharing"
            target="_blank"
            rel="noopener"
          >
            CellGuide roadmap
          </StyledLink>{" "}
          for planned updates or send us feedback with this
        </span>
      }
      analyticsHandler={() => {
        track(EVENTS.SUGGEST_CHANGE_CLICKED);
      }}
    />
  );
}
