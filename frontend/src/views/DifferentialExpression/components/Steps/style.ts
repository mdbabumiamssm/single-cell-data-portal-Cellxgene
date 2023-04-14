import styled from "@emotion/styled";
import { CommonThemeProps, fontHeaderM, fontCapsXxs, getColors } from "czifui";

interface StepProps extends CommonThemeProps {
  active?: boolean;
}

export const Wrapper = styled.div<CommonThemeProps>`
  width: 240px;
  height: 100%;
  display: flex;
  flex-direction: column;

  ${(props) => {
    const colors = getColors(props);

    return `
            border-right: 1px solid ${colors?.gray[300]};
        `;
  }}
`;

export const StepWrapper = styled.div<StepProps>`
  padding-left: 24px;
  padding-right: 24px;
  padding-top: 30px;
  height: 124px;

  ${(props) => {
    const colors = getColors(props);
    return props.active
      ? `
            border-left: 8px solid ${colors?.primary[400]};

            & > ${StepTitle} {
                color: ${colors?.gray[500]};
            }

            & > ${StepText} {
                color: black;
            }
        `
      : `
            & > ${StepTitle} {
                color: ${colors?.gray[400]};
            }

            & > ${StepText} {
                color: ${colors?.gray[400]};
            }
        `;
  }}
`;

export const StepTitle = styled.div<CommonThemeProps>`
  ${fontHeaderM}
  margin-bottom: 4px;
`;

export const StepText = styled.div<CommonThemeProps>`
  ${fontCapsXxs}
`;
