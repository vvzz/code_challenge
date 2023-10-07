import * as b from "fp-ts/boolean";
import { ADT, match, matchP } from "ts-adt";
import * as O from "fp-ts/Option";
import * as Eq from "fp-ts/Eq";
import { pipe } from "fp-ts/function";
import * as Ord from "fp-ts/Ord";
import { Functor1 } from "fp-ts/Functor";
import { Pointed1 } from "fp-ts/Pointed";
import { Apply1 } from "fp-ts/Apply";
import { Applicative1 } from "fp-ts/Applicative";
import { Monad1 } from "fp-ts/Monad";

// Custom data type I have previously implemented to express async data
// It simplifies representing and manipulating data that might be loading
// or failed

export type NoneData = {
  _type: "none";
};
export type PendingData<T> = {
  _type: "pending";
  delayed: boolean;
  data: O.Option<T>;
};
export type DoneData<T> = {
  _type: "done";
  data: T;
};

export type ErrorData = {
  _type: "error";
  error: Error;
};

export type AsyncData<T> = ADT<{
  none: {};
  pending: PendingData<T>;
  done: DoneData<T>;
  error: ErrorData;
}>;

export const none: AsyncData<never> = {
  _type: "none",
};

export const pending = <T>(data: O.Option<T>): AsyncData<T> => ({
  _type: "pending",
  delayed: false,
  data,
});
export const delayed = <T>(data: O.Option<T>): AsyncData<T> => ({
  _type: "pending",
  delayed: true,
  data,
});

export const error = (e: Error): AsyncData<never> => ({
  _type: "error",
  error: e,
});

export const done = <T>(data: T): AsyncData<T> => ({
  _type: "done",
  data,
});

export const of: <A>(a: A) => AsyncData<A> = done;
export const URI = "AsyncData";

export type URI = typeof URI;

declare module "fp-ts/HKT" {
  interface URItoKind<A> {
    readonly [URI]: AsyncData<A>;
  }
}

export const Pointed: Pointed1<URI> = {
  URI,
  of,
};

export const ap =
  <A>(fa: AsyncData<A>) =>
  <B>(fab: AsyncData<(a: A) => B>) =>
    isNone(fa)
      ? none
      : isNone(fab)
      ? none
      : isDone(fa) && isDone(fab)
      ? done(fab.data(fa.data))
      : isPending(fa) && isPending(fab)
      ? pipe(fab.data, O.ap(fa.data), pending)
      : isPending(fa) && isDone(fab)
      ? pipe(fa.data, O.map(fab.data), pending)
      : isDone(fa) && isPending(fab)
      ? pipe(fab.data, O.ap(O.some(fa.data)), pending)
      : none;

export const fold =
  <T, B>(
    onNone: (data: O.Option<T>) => B,
    onPending: (data: O.Option<T>) => B,
    onDone: (data: T) => B,
    onError: (e: Error) => B
  ) =>
  (ad: AsyncData<T>) =>
    pipe(
      ad,
      match({
        none: () => onNone(O.none),
        pending: (r) => onPending(r.data),
        done: (r) => onDone(r.data),
        error: (r) => onError(r.error),
      })
    );

export const foldW =
  <T, BA, BB, BC, BD>(
    onNone: (data: O.Option<T>) => BA,
    onPending: (data: O.Option<T>) => BB,
    onDone: (data: T) => BC,
    onError: (data: O.Option<T>) => BD
  ) =>
  (ad: AsyncData<T>) =>
    pipe(
      ad,
      match({
        none: () => onNone(O.none),
        pending: (r) => onPending(r.data),
        done: (r) => onDone(r.data),
        error: () => onError(O.none),
      })
    );

const _map: Monad1<URI>["map"] = (fa, f) => pipe(fa, map(f));
const _ap: Monad1<URI>["ap"] = (fab, fa) => pipe(fab, ap(fa));

export const Functor: Functor1<URI> = {
  URI,
  map: _map,
};

export const Apply: Apply1<URI> = {
  URI,
  map: _map,
  ap: _ap,
};

export const Applicative: Applicative1<URI> = {
  URI,
  map: _map,
  ap: _ap,
  of,
};

export const toDelayedData = <T>(ad: AsyncData<T>) =>
  pipe(
    ad,
    matchP({ pending: (_) => pipe(_.data, delayed) }, (_) => _)
  );

export const map =
  <A, B>(fa: (a: A) => B) =>
  (ad: AsyncData<A>): AsyncData<B> =>
    pipe(
      ad,
      match({
        none: (_) => _,
        pending: (_) => pipe(_.data, O.map(fa), pending),
        done: (_) => pipe(_.data, fa, done),
        error: (_) => _,
      })
    );

export const getEq = <T>(eq: Eq.Eq<T>) =>
  Eq.fromEquals<AsyncData<T>>((x, z) => {
    if (isNone(x) && isNone(z)) {
      return true;
    } else if (isDone(x) && isDone(z)) {
      return Eq.struct({
        data: eq,
      }).equals(x, z);
    } else if (isPending(x) && isPending(z)) {
      return Eq.struct({
        data: O.getEq(eq),
        delayed: b.Eq,
      }).equals(x, z);
    } else return false;
  });

export const getOrd = <T>(ord: Ord.Ord<T>) =>
  pipe(
    O.getOrd(ord),
    Ord.contramap((ad: AsyncData<T>) => pipe(ad, toOption))
  );

export const isDelayed = <T>(ad: AsyncData<T>) => isPending(ad) && ad.delayed;

export const isDone = <T>(ad: AsyncData<T>): ad is DoneData<T> =>
  ad._type === "done";

export const isNone = <T>(ad: AsyncData<T>): ad is NoneData =>
  ad._type === "none";
export const isPending = <T>(ad: AsyncData<T>): ad is PendingData<T> =>
  ad._type === "pending";

export const isError = <T>(ad: AsyncData<T>): ad is ErrorData =>
  ad._type === "error";

export const toOption = <T>(ad: AsyncData<T>): O.Option<T> =>
  pipe(
    ad,
    matchP(
      { none: () => O.none, pending: (_) => _.data, error: () => O.none },
      (_) => O.some(_.data)
    )
  );
