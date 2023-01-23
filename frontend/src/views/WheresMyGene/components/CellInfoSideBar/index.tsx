import { Button, Icon, Tooltip } from "czifui";
import React, { useCallback, useContext, useState } from "react";
import { track } from "src/common/analytics";
import { EVENTS } from "src/common/analytics/events";
import { ROUTES } from "src/common/constants/routes";
import { useMarkerGenes } from "src/common/queries/wheresMyGene";
import { BetaChip } from "src/components/Header/style";
import { DispatchContext, State } from "../../common/store";
import { addSelectedGenes } from "../../common/store/actions";
import {
  ButtonContainer,
  CopyGenesButton,
  StyledHTMLTable,
  StyledIconImage,
  StyledMarkerGeneHeader,
  StyledTooltip,
  TissueName,
  TooltipButton,
} from "./style";
import questionMarkIcon from "src/common/images/question-mark-icon.svg";
export interface CellInfoBarProps {
  cellInfoCellType: Exclude<State["cellInfoCellType"], null>;
  tissueName: string;
}

function CellInfoSideBar({
  cellInfoCellType,
  tissueName,
}: CellInfoBarProps): JSX.Element | null {
  const urlParams = new URLSearchParams(window.location.search);
  let testType: "binomtest" | undefined = undefined;

  if (urlParams.get("test") === "binomtest") {
    testType = "binomtest";
  }
  const { isLoading, data } = useMarkerGenes({
    cellTypeID: cellInfoCellType.cellType.id,
    tissueID: cellInfoCellType.tissueID,
    organismID: cellInfoCellType.organismID,
    test: testType,
  });

  const dispatch = useContext(DispatchContext);

  const handleCopyGenes = useCallback(() => {
    if (!data) return;
    const genes = Object.keys(data.marker_genes);
    navigator.clipboard.writeText(genes.join(", "));
    track(EVENTS.WMG_FMG_COPY_GENES_CLICKED);
  }, [data]);

  const handleDisplayGenes = useCallback(() => {
    if (!data || !dispatch) return;
    const genes = Object.keys(data.marker_genes);
    dispatch(addSelectedGenes(genes));
    track(EVENTS.WMG_FMG_ADD_GENES_CLICKED);
  }, [data, dispatch]);

  const [hoverStartTime, setHoverStartTime] = useState(0);

  const handleHoverEnd = useCallback(() => {
    if (Date.now() - hoverStartTime > 2 * 1000) {
      track(EVENTS.WMG_FMG_QUESTION_BUTTON_HOVER);
    }
  }, [hoverStartTime]);

  if (isLoading || !data) return null;

  if (!cellInfoCellType) return null;
  return (
    <div>
      <TissueName>{tissueName}</TissueName>
      <ButtonContainer>
        <div>
          <StyledMarkerGeneHeader>Marker Genes</StyledMarkerGeneHeader>
          <Tooltip
            sdsStyle="dark"
            placement="bottom"
            width="default"
            className="fmg-tooltip-icon"
            arrow={true}
            title={
              <StyledTooltip>
                <div>
                  Marker genes are highly and uniquely expressed in the cell
                  type relative to all other cell types.
                </div>
                <br />
                <div>
                  <a
                    href={ROUTES.FMG_DOCS}
                    rel="noopener"
                    target="_blank"
                    onClick={() => {
                      handleHoverEnd();
                      track(EVENTS.WMG_FMG_DOCUMENTATION_CLICKED);
                    }}
                  >
                    Click to read more about the identification method.
                  </a>
                </div>
              </StyledTooltip>
            }
          >
            <TooltipButton
              sdsStyle="minimal"
              sdsType="secondary"
              isAllCaps={false}
              style={{ fontWeight: "500" }}
              onMouseEnter={() => setHoverStartTime(Date.now())}
              onMouseLeave={handleHoverEnd}
            >
              <StyledIconImage src={questionMarkIcon} />
            </TooltipButton>
          </Tooltip>
          <BetaChip label="Beta" size="small" />
        </div>
        <Button
          startIcon={<Icon sdsIcon="plus" sdsSize="s" sdsType="button" />}
          onClick={handleDisplayGenes}
          sdsStyle="minimal"
          sdsType="primary"
          isAllCaps={false}
          style={{ fontWeight: "500" }}
        >
          Add to Dot Plot
        </Button>
      </ButtonContainer>
      <StyledHTMLTable condensed bordered={false}>
        <thead>
          <tr>
            <td>
              Gene{" "}
              <CopyGenesButton
                onClick={handleCopyGenes}
                sdsType="primary"
                sdsStyle="minimal"
                isAllCaps={false}
                startIcon={<Icon sdsIcon="copy" sdsSize="s" sdsType="button" />}
              >
                Copy
              </CopyGenesButton>
            </td>
            <td>Marker Score</td>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.marker_genes).map((gene) => (
            <tr key={gene[0]}>
              <td>{gene[0]}</td>
              <td>{gene[1].effect_size.toPrecision(4)}</td>
            </tr>
          ))}
        </tbody>
      </StyledHTMLTable>
    </div>
  );
}

export default CellInfoSideBar;
