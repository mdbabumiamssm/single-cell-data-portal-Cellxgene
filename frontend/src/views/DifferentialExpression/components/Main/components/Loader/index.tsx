import { LoadingIndicator } from "@czi-sds/components";
import { Wrapper } from "./style";

export default function Loader(): JSX.Element {
  return (
    <Wrapper>
      <LoadingIndicator sdsStyle="tag" />
    </Wrapper>
  );
}
