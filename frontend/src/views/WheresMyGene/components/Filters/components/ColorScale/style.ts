import styled from "@emotion/styled";
import { CommonThemeProps, getSpaces } from "czifui";

export const LabelWrapper = styled("div")`
  display: flex;
  align-items: center;

  ${(props: CommonThemeProps) => {
    const spaces = getSpaces(props);

    return `
      gap: ${spaces?.xxs}px;
    `;
  }}
`;
