import { pipe } from "fp-ts/function";
import React from "react";
import * as L from "monocle-ts/Lens";

export interface UIState {
  sessions: {
    activeOnly: boolean;
    addMode: boolean;
  };
}

export const initialState: UIState = {
  sessions: {
    activeOnly: false,
    addMode: false,
  },
};

export const ActiveOnlyL = pipe(
  L.id<UIState>(),
  L.prop("sessions"),
  L.prop("activeOnly")
);
export const AddModeL = pipe(
  L.id<UIState>(),
  L.prop("sessions"),
  L.prop("addMode")
);

export const UIStateControllerContext = React.createContext<
  [UIState, React.Dispatch<React.SetStateAction<UIState>>]
>(null as never);
export const UIStateController: React.FC<{ children?: React.ReactNode }> = (
  props
) => {
  const state = React.useState<UIState>(initialState);
  return (
    <UIStateControllerContext.Provider value={state}>
      {props.children}
    </UIStateControllerContext.Provider>
  );
};
