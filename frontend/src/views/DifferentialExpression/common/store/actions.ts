import { REDUCERS, State } from "./reducer";

export function selectOrganism(
  organismId: State["organismId"]
): GetActionTypeOfReducer<typeof REDUCERS["selectOrganism"]> {
  return {
    payload: organismId,
    type: "selectOrganism",
  };
}

export function selectFilters(
  key: keyof State["selectedFilters"],
  options: string[]
): GetActionTypeOfReducer<typeof REDUCERS["selectFilters"]> {
  return {
    payload: { key, options },
    type: "selectFilters",
  };
}

export function setSnapshotId(
  snapshotId: State["snapshotId"]
): GetActionTypeOfReducer<typeof REDUCERS["setSnapshotId"]> {
  return {
    payload: snapshotId,
    type: "setSnapshotId",
  };
}

type GetActionTypeOfReducer<T> = T extends (
  state: never,
  action: infer Action
) => unknown
  ? Action
  : never;
