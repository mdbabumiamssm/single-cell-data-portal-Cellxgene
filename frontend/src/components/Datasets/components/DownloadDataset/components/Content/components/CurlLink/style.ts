import styled from "@emotion/styled";
import { Button, fontBodyS, fontBodyXs } from "@czi-sds/components";
import {
  cornersM,
  grey100,
  grey300,
  grey500,
  spacesM,
  spacesS,
  spacesXxs,
} from "src/common/theme";

export const CodeBlock = styled.div`
  align-items: flex-start;
  background-color: ${grey100};
  border-radius: ${cornersM}px;
  box-shadow: inset 0 0 0 0.5px ${grey300};
  display: flex;
  gap: ${spacesS}px;
  margin: 0;
  padding: ${spacesS}px ${spacesM}px;

  code {
    ${fontBodyS};
    background-color: transparent;
    box-sizing: content-box;
    flex: 1;
    font-feature-settings: "kern", "calt", "kern"; // TODO(cc) review font feature settings.
    padding: ${spacesXxs}px 0 0;
  }

  code:before,
  code:after {
    content: unset; // overrides styles from layout.css.
  }
`;

export const CopyButton = styled(Button)`
  ${fontBodyS};
  min-width: unset;
  font-weight: 500;
`;

export const Caption = styled.div`
  ${fontBodyXs};
  color: ${grey500};
`;
