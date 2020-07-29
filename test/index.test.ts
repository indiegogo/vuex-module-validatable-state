import Vue from "vue";
import Vuex from "vuex";
import { register, ActionTypes, GetterTypes } from "../src/index";

Vue.use(Vuex);
const moduleInternalKey = "validatableState";

describe("vuex-validatable-field-module", () => {
  const setupStore = (opt: { initialFields?: {}; validators?: {}; gettersOnCaller? : {}; } = {}) => {
    const initialFields = opt.initialFields || {
      name: null,
      age: null,
      subscribed: false
    };

    const store = new Vuex.Store({
      state: {},
      getters: opt.gettersOnCaller || {},
      actions: {},
      mutations: {},
    });

    register(store, "", initialFields, opt.validators || {});
    return store;
  };

  describe("Initializing", () => {
    it("The store gets initial values and setup meta info on under the internal key", () => {
      const store = setupStore();
      expect(store.state[moduleInternalKey]).toEqual({
        fields: {
          age: {
            value: null,
            error: false,
            disabled: false,
            dirty: false,
            isEnabledValidation: false
          },
          name: {
            value: null,
            error: false,
            disabled: false,
            dirty: false,
            isEnabledValidation: false
          },
          subscribed: {
            value: false,
            error: false,
            disabled: false,
            dirty: false,
            isEnabledValidation: false
          }
        }
      });
    });
  });

  describe("Mutations", () => {
    it("SET_FIELD_VALUE updates field's value", () => {
      const store = setupStore();
      expect(store.state[moduleInternalKey].fields.age.value).toBe(null);
      store.commit("SET_FIELD_VALUE", { name: "age", value: 14 });
      expect(store.state[moduleInternalKey].fields.age.value).toBe(14);
    });

    it("SET_FIELD_ERROR updates field's error", () => {
      const store = setupStore();
      expect(store.state[moduleInternalKey].fields.name.error).toBe(false);
      store.commit("SET_FIELD_ERROR", { name: "name", error: "the error message" });
      expect(store.state[moduleInternalKey].fields.name.error).toBe("the error message");
    });

    it("SET_FIELD_EDITABILITY updates field's disableness", () => {
      const store = setupStore();
      expect(store.state[moduleInternalKey].fields.subscribed.disabled).toBe(false);
      store.commit("SET_FIELD_EDITABILITY", { name: "subscribed", editable: false });
      expect(store.state[moduleInternalKey].fields.subscribed.disabled).toBe(true);
    });

    it("INITIALIZE_FIELDS updates multiple field's at once", () => {
      const store = setupStore();
      store.commit("INITIALIZE_FIELDS", { name: "Izuku Midoriya", age: 15, subscribed: true });
      expect(store.state[moduleInternalKey].fields.name.value).toBe("Izuku Midoriya");
      expect(store.state[moduleInternalKey].fields.age.value).toBe(15);
      expect(store.state[moduleInternalKey].fields.subscribed.value).toBe(true);
    });

    it("ENABLE_ALL_VALIDATIONS updates all isEnabledValidation flag as true", () => {
      const store = setupStore();
      expect(
        Object.keys(store.state[moduleInternalKey].fields).map(key => store.state[moduleInternalKey].fields[key].isEnabledValidation)
      ).toEqual([false, false, false])
      store.commit("ENABLE_ALL_VALIDATIONS");
      expect(
        Object.keys(store.state[moduleInternalKey].fields).map(key => store.state[moduleInternalKey].fields[key].isEnabledValidation)
      ).toEqual([true, true, true])
    });

    it("SET_FIELD_DIRTINESS updates drity flag", () => {
      const store = setupStore();
      expect(store.state[moduleInternalKey].fields.name.dirty).toBe(false);
      store.commit("SET_FIELD_DIRTINESS", { name: "name", dirty: true });
      expect(store.state[moduleInternalKey].fields.name.dirty).toBe(true);
    });

    it("SET_FIELDS_PRISTINE updates all drity flags false", () => {
      const store = setupStore();
      store.commit("SET_FIELD_DIRTINESS", { name: "name", dirty: true });
      store.commit("SET_FIELD_DIRTINESS", { name: "age", dirty: true });
      expect(store.state[moduleInternalKey].fields.name.dirty).toBe(true);
      expect(store.state[moduleInternalKey].fields.age.dirty).toBe(true);
      expect(store.state[moduleInternalKey].fields.subscribed.dirty).toBe(false);
      store.commit("SET_FIELDS_PRISTINE");
      expect(store.state[moduleInternalKey].fields.name.dirty).toBe(false);
      expect(store.state[moduleInternalKey].fields.age.dirty).toBe(false);
      expect(store.state[moduleInternalKey].fields.subscribed.dirty).toBe(false);
    });
  });

  describe("Getters", () => {
    describe("ALL_FIELDS_VALID", () => {
      it("return true if all errors are false", () => {
        const store = setupStore();
        expect(store.getters[GetterTypes.ALL_FIELDS_VALID]).toBe(true);
      });

      it("return false if any field has error", () => {
        const store = setupStore();
        store.commit("SET_FIELD_ERROR", { name: "name", error: "the error message" });
        expect(store.getters[GetterTypes.ALL_FIELDS_VALID]).toBe(false);
      });

      it("return true if the field has error is disabled", () => {
        const store = setupStore();
        store.commit("SET_FIELD_ERROR", { name: "name", error: "the error message" });
        store.commit("SET_FIELD_EDITABILITY", { name: "name", editable: false });
        expect(store.getters[GetterTypes.ALL_FIELDS_VALID]).toBe(true);
      });
    });

    describe("ANY_FIELD_CHANGED", () => {
      it("returns false if any field is not changed", () => {
        const store = setupStore();
        expect(store.getters[GetterTypes.ANY_FIELD_CHANGED]).toBe(false);
      });

      it("returns true if any field is changed", () => {
        const store = setupStore();
        store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "name", value: "new data" });
        expect(store.getters[GetterTypes.ANY_FIELD_CHANGED]).toBe(true);
      });

      it("returns false if the changed field is disabled", () => {
        const store = setupStore();
        store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "name", value: "new data" });
        store.commit("SET_FIELD_EDITABILITY", { name: "name", editable: false });
        expect(store.getters[GetterTypes.ANY_FIELD_CHANGED]).toBe(false);
      });
    });

    describe("FIELD_VALUES", () => {
      it("returns key value pair of field's value", () => {
        const store = setupStore();
        expect(store.getters[GetterTypes.FIELD_VALUES]).toEqual({
          age: null,
          name: null,
          subscribed: false
        });
      });
    });

    describe("FIELD_ERRORS", () => {
      it("returns key value pair of field's error", () => {
        const store = setupStore();
        expect(store.getters[GetterTypes.FIELD_ERRORS]).toEqual({
          age: false,
          name: false,
          subscribed: false
        });

        store.commit("SET_FIELD_ERROR", { name: "name", error: "the error message" });
        expect(store.getters[GetterTypes.FIELD_ERRORS]).toEqual({
          age: false,
          name: "the error message",
          subscribed: false
        });
      });

      it("doesn't handle as error if the field which has error is disabled", () => {
        const store = setupStore();
        store.commit("SET_FIELD_ERROR", { name: "name", error: "the error message" });
        store.commit("SET_FIELD_EDITABILITY", { name: "name", editable: false });
        expect(store.getters[GetterTypes.FIELD_ERRORS]).toEqual({
          age: false,
          name: false,
          subscribed: false
        });
      });
    });

    describe("FIELD_EDITABILITIES", () => {
      it("returns key value pair of field's editability", () => {
        const store = setupStore();
        expect(store.getters[GetterTypes.FIELD_EDITABILITIES]).toEqual({
          age: true,
          name: true,
          subscribed: true
        });
      });
    });

    describe("FIELD_DIRTINESSES", () => {
      it("returns key value pair of field's dirtiness", () => {
        const store = setupStore();
        expect(store.getters[GetterTypes.FIELD_DIRTINESSES]).toEqual({
          age: false,
          name: false,
          subscribed: false
        });
      });
    });
  });

  describe("Actions", () => {
    const ageShouldBeAdult = () => [({ age }) => age && age > 21 ? false : "should be an adult", { instant: true }];

    describe("SET_FIELD_VALUE", () => {
      it("sets new value for field", async () => {
        const store = setupStore();
        await store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "subscribed", value: true });
        expect(store.getters[GetterTypes.FIELD_VALUES]).toEqual({
          name: null,
          age: null,
          subscribed: true
        });
      });

      it("then runs validation", async () => {
        const store = setupStore({
          validators: {
            age: [
              ageShouldBeAdult
            ]
          }
        });
        await store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "subscribed", value: true });
        expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe("should be an adult");
      });

      it("then make field dirty", async () => {
        const store = setupStore();
        await store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "subscribed", value: true });
        expect(store.getters[GetterTypes.FIELD_DIRTINESSES]).toEqual({
          name: false,
          age: false,
          subscribed: true
        });
      });

      describe("the field is disabled", () => {
        it("doesn't set new value", async () => {
          const store = setupStore();
          store.commit("SET_FIELD_EDITABILITY", { name: "subscribed", editable: false });
          await store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "subscribed", value: true });
          expect(store.getters[GetterTypes.FIELD_VALUES]).toEqual({
            name: null,
            age: null,
            subscribed: false
          });
        });

        it("doesn't run validation", async () => {
          const store = setupStore({
            validators: {
              age: [
                ageShouldBeAdult
              ]
            }
          });
          store.commit("SET_FIELD_EDITABILITY", { name: "subscribed", editable: false });
          await store.dispatch(ActionTypes.SET_FIELD_VALUE, { name: "subscribed", value: true });
          expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe(false);
        });
      });
    });

    describe("SET_FIELD_EDITABILITY", () => {
      it("sets editability for field", async () => {
        const store = setupStore();
        await store.dispatch(ActionTypes.SET_FIELD_EDITABILITY, { name: "subscribed", editable: false });
        expect(store.getters[GetterTypes.FIELD_EDITABILITIES]).toEqual({
          name: true,
          age: true,
          subscribed: false
        });
      });

      it("then runs validation", async () => {
        const store = setupStore({
          validators: {
            age: [
              ageShouldBeAdult
            ]
          }
        });
        await store.dispatch(ActionTypes.SET_FIELD_EDITABILITY, { name: "subscribed", editable: false });
        expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe("should be an adult");
      });
    });

    describe("SET_FIELD_EDITABILITIES_BULK", () => {
      it("sets multiple fields' editabilities", async () => {
        const store = setupStore();
        await store.dispatch(ActionTypes.SET_FIELD_EDITABILITIES_BULK, { name: false, age: true, subscribed: false });
        expect(store.getters[GetterTypes.FIELD_EDITABILITIES]).toEqual({
          name: false,
          age: true,
          subscribed: false
        });
      });

      it("then runs validation", async () => {
        const store = setupStore({
          validators: {
            age: [ageShouldBeAdult]
          }
        });
        await store.dispatch(ActionTypes.SET_FIELD_EDITABILITIES_BULK, { name: false, age: true, subscribed: false });
        expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe("should be an adult");
      });
    });

    describe("SET_FIELDS_BULK", () => {
      it("sets multiple fields", async () => {
        const store = setupStore();
        await store.dispatch(ActionTypes.SET_FIELDS_BULK, { name: "Izuku Midoriya", age: 15, subscribed: true });
        expect(store.getters[GetterTypes.FIELD_VALUES]).toEqual({
          name: "Izuku Midoriya",
          age: 15,
          subscribed: true
        });
      });

      it("then runs validation", async () => {
        const store = setupStore({
          validators: {
            age: [
              ageShouldBeAdult
            ]
          }
        });
        await store.dispatch(ActionTypes.SET_FIELDS_BULK, { name: "Izuku Midoriya", age: 15, subscribed: true });
        expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe("should be an adult");
      });
    });

    describe("RESET_FIELDS", () => {
      it("resets fields with initial data", () => {
        const store = setupStore();
        store.commit("INITIALIZE_FIELDS", { name: "Izuku Midoriya", age: 15, subscribed: true });
        expect(store.getters[GetterTypes.FIELD_VALUES]).toEqual({
          name: "Izuku Midoriya",
          age: 15,
          subscribed: true
        });
        store.dispatch(ActionTypes.RESET_FIELDS);
        expect(store.getters[GetterTypes.FIELD_VALUES]).toEqual({
          name: null,
          age: null,
          subscribed: false
        });
      });
    });

    describe("VALIDATE_FIELDS", () => {
      describe("isEnabledValidation is flagged", () => {
        it("store error message if validator returns", async () => {
          const mockAge = jest.fn().mockReturnValue("error message on age");
          const store = setupStore({
            validators: {
              age: [
                () => mockAge()
              ]
            }
          });

          store.commit("ENABLE_ALL_VALIDATIONS");
          await store.dispatch(ActionTypes.VALIDATE_FIELDS);

          expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe("error message on age");
        });

        it("store false if validator doesn't return error message", async () => {
          const mockAge = jest.fn().mockReturnValue(false);
          const store = setupStore({
            validators: {
              age: [
                () => mockAge()
              ]
            }
          });

          store.commit("ENABLE_ALL_VALIDATIONS");
          await store.dispatch(ActionTypes.VALIDATE_FIELDS);

          expect(store.getters[GetterTypes.FIELD_ERRORS].age).toBe(false);
        });

        describe("if given validator for multiple fields", () => {
          it("runs all validations", async () => {
            const mockAge = jest.fn();
            const mockName = jest.fn();
            const store = setupStore({
              validators: {
                name: [
                  () => mockName()
                ],
                age: [
                  () => mockAge()
                ]
              }
            });

            store.commit("ENABLE_ALL_VALIDATIONS");
            await store.dispatch(ActionTypes.VALIDATE_FIELDS);

            expect(mockName).toHaveBeenCalled();
            expect(mockAge).toHaveBeenCalled();
          });

          it("gives all fields for each validator", async () => {
            const mockName = jest.fn();
            const store = setupStore({
              validators: {
                name: [
                  param => mockName(param)
                ]
              }
            });

            store.commit("ENABLE_ALL_VALIDATIONS");
            await store.dispatch(ActionTypes.VALIDATE_FIELDS);

            expect(mockName).toHaveBeenCalledWith({ name: null, age: null, subscribed: false });
          });

          it("gives getters to validator", async () => {
            const mockName = jest.fn();
            const store = setupStore({
              validators: {
                name: [
                  (_param, getters) => mockName(getters.theGetterOnMainStore)
                ]
              },
              gettersOnCaller: {
                theGetterOnMainStore: () => "Hello I'm on main store"
              }
            });

            expect(store.getters.theGetterOnMainStore).toBe("Hello I'm on main store");

            store.commit("ENABLE_ALL_VALIDATIONS");
            await store.dispatch(ActionTypes.VALIDATE_FIELDS);

            expect(mockName).toHaveBeenCalledWith("Hello I'm on main store");
          });
        });

        describe("if given multiple validators on a single fields", () => {
          it("run all validations until gets error", async () => {
            const mockNameFirstValidator = jest.fn().mockReturnValue(false);
            const mockNameSecondValidator = jest.fn().mockReturnValue("error message");
            const mockNameThirdValidator = jest.fn();
            const store = setupStore({
              validators: {
                name: [
                  () => mockNameFirstValidator(),
                  () => mockNameSecondValidator(),
                  () => mockNameThirdValidator()
                ]
              }
            });

            store.commit("ENABLE_ALL_VALIDATIONS");
            await store.dispatch(ActionTypes.VALIDATE_FIELDS);

            expect(mockNameFirstValidator).toHaveBeenCalled();
            expect(mockNameSecondValidator).toHaveBeenCalled();
            expect(mockNameThirdValidator).not.toHaveBeenCalled();
          });
        });
      });

      describe("state.validate is not flagged", () => {
        describe("but a validator enables instant option", () => {
          it("run only enabled validation", async () => {
            const mockNameFirstValidator = jest.fn().mockReturnValue([() => "error message 1", { instant: false }]);
            const mockNameSecondValidator = jest.fn().mockReturnValue("error message 2");
            const mockNameThirdValidator = jest.fn().mockReturnValue([() => "error message 3", { instant: true }]);
            const store = setupStore({
              validators: {
                name: [
                  () => mockNameFirstValidator(),
                  () => mockNameSecondValidator(),
                  () => mockNameThirdValidator()
                ]
              }
            });

            await store.dispatch(ActionTypes.VALIDATE_FIELDS);

            expect(store.getters[GetterTypes.FIELD_ERRORS].name).toBe("error message 3");
          });
        });
      });
    });

    describe("ENABLE_ALL_VALIDATIONS", () => {
      it("enable all isEnabledValidation flag", () => {
        const store = setupStore();
        expect(
          Object.keys(store.state[moduleInternalKey].fields).map(key => store.state[moduleInternalKey].fields[key].isEnabledValidation)
        ).toEqual([false, false, false])
        store.dispatch(ActionTypes.ENABLE_ALL_VALIDATIONS);
        expect(
          Object.keys(store.state[moduleInternalKey].fields).map(key => store.state[moduleInternalKey].fields[key].isEnabledValidation)
        ).toEqual([true, true, true])
      });
    });

    describe("SET_FIELDS_PRISTINE", () => {
      it("makes all fields non-dirty", () => {
        const store = setupStore();
        store.commit("SET_FIELD_DIRTINESS", { name: "name", dirty: true });
        store.commit("SET_FIELD_DIRTINESS", { name: "age", dirty: true });
        expect(store.state[moduleInternalKey].fields.name.dirty).toBe(true);
        expect(store.state[moduleInternalKey].fields.age.dirty).toBe(true);
        expect(store.state[moduleInternalKey].fields.subscribed.dirty).toBe(false);
        store.dispatch(ActionTypes.SET_FIELDS_PRISTINE);
        expect(store.state[moduleInternalKey].fields.name.dirty).toBe(false);
        expect(store.state[moduleInternalKey].fields.age.dirty).toBe(false);
        expect(store.state[moduleInternalKey].fields.subscribed.dirty).toBe(false);
      });
    });
  });
});
