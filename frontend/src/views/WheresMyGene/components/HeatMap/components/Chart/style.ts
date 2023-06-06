import { css } from "@emotion/css";
import styled from "@emotion/styled";
import {
  fontBodyXs,
  getColors,
  getSpaces,
  TooltipTable,
} from "@czi-sds/components";
import { X_AXIS_CHART_HEIGHT_PX } from "src/views/WheresMyGene/common/constants";

export const ChartContainer = styled.div`
  ${getWidthAndHeight}
  margin-bottom: ${X_AXIS_CHART_HEIGHT_PX}px;
`;

function getWidthAndHeight({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return `
    width: ${width}px;
    height: ${height}px;
  `;
}

export const StyledTooltipTable = styled(TooltipTable)`
  display: flex;
  flex-direction: column;

  ${(props) => {
    const spaces = getSpaces(props);

    return `
      gap: ${spaces?.l}px;
      padding-bottom: ${spaces?.xs}px;
    `;
  }}

  > div {
    padding-top: 0 !important;
  }

  .MuiTableRow-root {
    vertical-align: baseline;
  }

  .MuiTable-root {
    margin-bottom: 0;
  }

  .MuiTableCell-alignLeft {
    ${fontBodyXs}
    width: 30%;
    white-space: nowrap;
  }

  .MuiTableCell-alignRight {
    ${(props) => {
      const colors = getColors(props);

      return `
        color: ${colors?.gray[500]};
      `;
    }}
  }
`;

export const tooltipCss = css`
  margin: 0;
  margin-top: 20px;
  max-width: 500px !important;
`;
