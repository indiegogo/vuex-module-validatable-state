import { ActionTree, GetterTree, MutationTree, Store, ModuleTree } from "vuex";

interface FormField<T> {
  value: T;
  error: string | false;
  disabled: boolean;
  dirty: boolean;
}

const initialStateOfField = <T>(initialValue: T): FormField<T> => ({
  value: initialValue,
  error: false,
  disabled: false,
  dirty: false
});

interface ValidatableFieldsState<T> {
  validatableState: {
    [K in keyof T]: FormField<T[K]>;
  };
};

type ValidationResult = false | string;
interface ValidationOption { instant: boolean; }

// In the consumer's end, [() => "error message", { instant: true; }] is inferred as (string | { instant: true })[]
// So that doesn't match ValidatorWithOption's type: [() => ValidationResult, ValidationOption]
// https://github.com/Microsoft/TypeScript/issues/16656
// type Validator<T> = (ValidatorWithoutOption<T> | ValidatorWithOption<T>);
// type ValidatorWithoutOption<T> = (fields: Partial<T>, getters?) => ValidationResult;
// type ValidatorWithOption<T> = () => [(fields: Partial<T>) => ValidationResult, ValidationOption];
export type Validator<T> = (fields?: Partial<T>, getters?) => ValidationResult | [(fields?: Partial<T>, getters?) => ValidationResult, ValidationOption];

export type ValidatorTree<T> = {
  [key in keyof T]?: Validator<T>[];
};

export type FieldValidationErrors<F> = {
  [key in keyof F]: ValidationResult;
};

export type FieldEditabilities<F> = {
  [key in keyof F]: boolean;
};

export type FieldDirtinesses<F> = {
  [key in keyof F]: boolean;
};

export type SetFieldAction<F> = <T extends keyof F>(payload: { name: T ; value: F[T]; }) => void;

export enum GetterTypes {
  ALL_FIELDS_VALID = "validatableStateAllFieldsValid",
  ANY_FIELD_CHANGED = "validatableStateAnyFieldChanged",
  FIELD_VALUES = "validatableStateFieldValues",
  FIELD_ERRORS = "validatableStateFieldErrors",
  FIELD_EDITABILITIES = "validatableStateFieldEditabilities",
  FIELD_DIRTINESSES = "validatableStateFieldDirtinesses"
}

enum MutationTypes {
  INITIALIZE_FIELDS = "INITIALIZE_FIELDS",
  SET_FIELD_VALUE = "SET_FIELD_VALUE",
  SET_FIELD_ERROR = "SET_FIELD_ERROR",
  SET_FIELD_EDITABILITY = "SET_FIELD_EDITABILITY",
  SET_FIELD_EDITABILITIES_BULK = "SET_FIELD_EDITABILITIES_BULK",
  SET_FIELD_DIRTINESS = "SET_FIELD_DIRTINESS",
  ENABLE_ALL_VALIDATIONS = "ENABLE_ALL_VALIDATIONS",
  SET_FIELDS_PRISTINE = "SET_FIELDS_PRISTINE"
}

export enum ActionTypes {
  SET_FIELD_VALUE = "validatableStateSetFieldValue",
  SET_FIELD_EDITABILITY = "validatableStateSetFieldEditability",
  SET_FIELDS_BULK = "validatableStateSetFieldsBulk",
  SET_FIELD_EDITABILITIES_BULK = "validatableStateSetFieldEditabilitiesBulk",
  RESET_FIELDS = "validatableStateResetFields",
  VALIDATE_FIELDS = "validatableStateValidateFields",
  ENABLE_ALL_VALIDATIONS = "validatableStateEnableAllValidations",
  SET_FIELDS_PRISTINE = "validatableStateSetFieldsPristine"
}
interface InternalState<F> {
  fields: ValidatableFieldsState<F>["validatableState"];
  validates: boolean;
}

/**
 * Function returns Vuex module to provide validatable field lifecycle
 * @param initialFields - Field names with initial variable
 * @param validators - Validators for each field
 * @example
 * buildModule(
 *   { name: null, age: null },
 *   {
 *     name: [
 *       ({ name }) => name && name.length > 2
 *     ],
 *     age: [
 *       ({ age }) => age && age > 0
 *     ]
 *   }
 * )
 */
const buildModule = <S, F>(
  initialFields: F,
  validators: ValidatorTree<F>
): ModuleTree<any> => {
  const stateFields = { fields: {}, validates: false } as InternalState<F>; // fields is not fulfilling the actual type...
  (Object.entries(initialFields) as [keyof F, F[keyof F]][]).forEach(([key, initialValue]) => {
    stateFields.fields[key] = initialStateOfField(initialValue);
  });

  const getters: GetterTree<InternalState<F>, S> = {
    [GetterTypes.ALL_FIELDS_VALID] ({ fields }): boolean {
      return Object.keys(fields).every((name: string) => fields[name].disabled || fields[name].error === false);
    },

    [GetterTypes.ANY_FIELD_CHANGED] ({ fields }): boolean {
      return Object.keys(fields).some((name: string) => fields[name].dirty === true && !fields[name].disabled);
    },

    [GetterTypes.FIELD_VALUES] ({ fields }): Partial<F> {
      const keyValue: Partial<F> = {};
      (Object.entries(fields) as [keyof F, FormField<any>][]).forEach(([key, formField]) => {
        keyValue[key] = formField.value;
      });
      return keyValue;
    },

    [GetterTypes.FIELD_ERRORS] ({ fields }): Partial<FieldValidationErrors<F>> {
      const keyValue: { [key in keyof F]?: ValidationResult } = {};
      (Object.entries(fields) as [keyof F, FormField<any>][]).forEach(([key, formField]) => {
        keyValue[key] = formField.error;
        if (formField.disabled) {
          keyValue[key] = false;
        }
      });
      return keyValue;
    },

    [GetterTypes.FIELD_EDITABILITIES] ({ fields }): Partial<FieldEditabilities<F>> {
      const keyValue: { [key in keyof F]?: boolean } = {};
      (Object.entries(fields) as [keyof F, FormField<any>][]).forEach(([key, formField]) => {
        keyValue[key] = !formField.disabled;
      });
      return keyValue;
    },

    [GetterTypes.FIELD_DIRTINESSES] ({ fields }): Partial<FieldDirtinesses<F>> {
      const keyValue: { [key in keyof F]?: boolean } = {};
      (Object.entries(fields) as [keyof F, FormField<any>][]).forEach(([key, formField]) => {
        keyValue[key] = formField.dirty;
      });
      return keyValue;
    }
  };

  const mutations: MutationTree<InternalState<F>> = {
    [MutationTypes.SET_FIELD_VALUE] (state, payload) {
      state.fields[payload.name].value = payload.value;
    },

    [MutationTypes.SET_FIELD_ERROR] (state, { name, error }: { name: keyof F; error: ValidationResult; }) {
      state.fields[name].error = error;
    },

    [MutationTypes.SET_FIELD_EDITABILITY] (state, { name, editable }: { name: keyof F; editable: boolean; }) {
      state.fields[name].disabled = !editable;
    },

    [MutationTypes.SET_FIELD_EDITABILITIES_BULK] (state, fields: { [key: string]: boolean; }) {
      Object.keys(fields).forEach((fieldKey) => {
        state.fields[fieldKey].disabled = !fields[fieldKey];
      });
    },

    [MutationTypes.SET_FIELD_DIRTINESS] (state, { name, dirty }: { name: keyof F; dirty: boolean; }) {
      state.fields[name].dirty = dirty;
    },

    [MutationTypes.INITIALIZE_FIELDS] (state, fields: { [key: string]: any; }) {
      state.validates = false;
      Object.keys(state.fields).forEach((fieldKey) => {
        state.fields[fieldKey] = initialStateOfField(fields[fieldKey]);
      });
    },

    [MutationTypes.ENABLE_ALL_VALIDATIONS] (state) {
      state.validates = true;
    },

    [MutationTypes.SET_FIELDS_PRISTINE] (state) {
      Object.keys(state.fields).forEach((fieldKey) => {
        state.fields[fieldKey].dirty = false;
      });
    }
  };

  const actions: ActionTree<InternalState<F>, S> = {
    async [ActionTypes.SET_FIELD_VALUE] <T extends keyof F> ({ state, commit, dispatch }, { name, value }: { name: T; value: F[T]; }) {
      if (!state.fields[name].disabled) {
        commit(MutationTypes.SET_FIELD_DIRTINESS, { name, dirty: true });
        commit(MutationTypes.SET_FIELD_VALUE, { name, value });
        await dispatch(ActionTypes.VALIDATE_FIELDS);
      }
    },

    async [ActionTypes.SET_FIELD_EDITABILITY] <T extends keyof F> ({ commit, dispatch }, { name, editable }: { name: T; editable: boolean; }) {
      commit(MutationTypes.SET_FIELD_EDITABILITY, { name, editable });
      await dispatch(ActionTypes.VALIDATE_FIELDS);
    },

    async [ActionTypes.SET_FIELDS_BULK] <T extends keyof F> ({ commit, dispatch }, fields: { [key in T]: F[T] }) {
      commit(MutationTypes.INITIALIZE_FIELDS, fields);
      await dispatch(ActionTypes.VALIDATE_FIELDS);
    },

    async [ActionTypes.SET_FIELD_EDITABILITIES_BULK] <T extends keyof F> ({ commit, dispatch }, fields: { [key in T]: boolean }) {
      commit(MutationTypes.SET_FIELD_EDITABILITIES_BULK, fields);
      await dispatch(ActionTypes.VALIDATE_FIELDS);
    },

    [ActionTypes.RESET_FIELDS] ({ commit }): void {
      commit(MutationTypes.INITIALIZE_FIELDS, initialFields);
    },

    async [ActionTypes.VALIDATE_FIELDS] ({ state, commit, getters }) {
      Object.keys(state.fields).forEach(async (name: string) => {
        const validatorsForField: Validator<F>[] = validators[name];
        if (validatorsForField) {
          let errorForField: false | string = false;
          validatorsForField.some((validatorForField) => {
            const validatorResult = validatorForField(getters[GetterTypes.FIELD_VALUES], getters);

            if (validatorResult instanceof Array) {
              if (validatorResult[1].instant === true || state.validates) {
                errorForField = validatorResult[0](getters[GetterTypes.FIELD_VALUES], getters);
              }
            } else if (state.validates) {
              errorForField = validatorResult;
            }
            return !!errorForField;
          });

          if (state.fields[name].error !== errorForField) {
            commit(MutationTypes.SET_FIELD_ERROR, { name, error: errorForField });
          }
        }
      });
    },

    async [ActionTypes.ENABLE_ALL_VALIDATIONS] ({ dispatch, commit }) {
      commit(MutationTypes.ENABLE_ALL_VALIDATIONS);
      return dispatch(ActionTypes.VALIDATE_FIELDS);
    },

    async [ActionTypes.SET_FIELDS_PRISTINE] ({ commit }) {
      commit(MutationTypes.SET_FIELDS_PRISTINE);
    }
  };

  return {
    validatableState: {
      state: {
        ...stateFields
      },
      mutations,
      getters,
      actions
    }
  };
}

export default buildModule;

/**
 * Function to register validatable state module to the instance of Vuex.Store
 * @param store - The instance of Vuex.Store which is registered this module
 * @param parentNameSpace - Namespace (slash separated) which this module belongs: "", undefined means root
 * @param initialFields - Field names with initial variable
 * @param validators - Validators for each field
 * @example
 * register(
 *   store,
 *   "user/user-profile-form"
 *   { name: null, age: null },
 *   {
 *     name: [
 *       ({ name }) => name && name.length > 2
 *     ],
 *     age: [
 *       ({ age }) => age && age > 0
 *     ]
 *   }
 * )
 */
export const register = <S extends {}, F extends {}>(store: Store<S>, parentNameSpace: string = "", initialFields: F, validators: ValidatorTree<F>) => {
  const namespace: string[] = (parentNameSpace + "/validatableState").split("/").filter((name) => name !== "");
  store.registerModule(namespace, buildModule<S, F>(initialFields, validators)["validatableState"]);
}
