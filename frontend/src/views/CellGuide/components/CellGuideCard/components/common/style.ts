import styled from "@emotion/styled";
import { fontHeaderM, fontBodyXxs, fontBodyS } from "@czi-sds/components";
import { Divider } from "@mui/material";
import { gray500 } from "src/common/theme";

export const TableTitle = styled.div`
  ${fontHeaderM}
  cursor: default;
`;

export const TableTitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 48px;
  margin-bottom: 8px;
`;

interface TableTitleInnerWrapperProps {
  columnGap?: number;
}

export const TableTitleInnerWrapper = styled.div<TableTitleInnerWrapperProps>`
  display: flex;
  align-items: center;
  ${(props) => {
    const columnGap = props.columnGap ?? 8;
    return `
      column-gap: ${columnGap}px;
    `;
  }}
`;

export const FlexRow = styled.div`
  display: flex;
  align-items: center;
`;

export const TableUnavailableContainer = styled("div")`
  margin-top: 16px;
  background: #f8f8f8;

  width: 100%;

  height: 120px;

  display: flex;
  flex-direction: column;

  justify-content: center;
  text-align: center;
  border-radius: 8px;
`;

export const TableUnavailableHeader = styled("span")`
  ${fontBodyS}
  color: black;
  font-weight: 500;
`;

export const TableUnavailableDescription = styled("span")`
  ${fontBodyXxs}

  color: ${gray500};
`;

export const StyledDivider = styled(Divider)`
  margin-top: 8px;
`;
