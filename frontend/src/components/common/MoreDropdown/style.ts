import styled from "@emotion/styled";
import { ButtonIcon, CommonThemeProps, getSpaces } from "@czi-sds/components";

const spacesXs = (props: CommonThemeProps) => getSpaces(props)?.xs;

export const MoreButton = styled(ButtonIcon)`
  padding: ${spacesXs}px;

  .MuiSvgIcon-root {
    height: 16px;
    width: 16px;
  }
`;
