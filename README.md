# vuex-module-validatable-state

[![npm](https://img.shields.io/npm/v/vuex-module-validatable-state.svg?style=for-the-badge)](https://www.npmjs.com/package/vuex-module-validatable-state)
[![CircleCI](https://img.shields.io/circleci/project/github/indiegogo/vuex-module-validatable-state/master.svg?style=for-the-badge)](https://circleci.com/gh/indiegogo/vuex-module-validatable-state)

Simple Vuex module to handle form fields and validations.

![190611_module](https://user-images.githubusercontent.com/85887/59253812-dcd08180-8be3-11e9-922d-c5c6e6a2e777.gif)

You can build a view model for your form, which runs valdations easily. You just provide initial fields and validators to build the module, then map getters/actions to components.

Play in [this sandbox](https://o46g3.codesandbox.io/).

## Usage

### Installation

```
$ npm i vuex-module-validatable-state
```

### Register to core Vuex module

This module provides the function to return Vuex module as default. The function takes arguments:

- Initial field set
- Validators
 
<details>
  <summary>A. Define directly</summary>

```ts
import validatableModule from "vuex-module-validatable-state";

const initialFields = {
  amount: null,
  description: "default text"
};

const validators = {
  amount: [
    ({ amount }) => amount === null ? "Require this" : false
  ],
  description: [
    ({ description }) => description.length > 15 ? "Should be shorter than 15" : false,
    ({ description, amount }) => description.indexOf(amount.toString())  ? "Should include amount" : false,
  ]
};

new Vuex.Store({
  modules: {
    myForm: {
      namespaced: true
      store,
      getters,
      actions,
      mutations,
      modules: {
        ...validatableModule(initialFields, validators) // <-- HERE
      }
    }
  }
});
```
</details>

<details>
  <summary>B. Register to existing module</summary>

```ts
import { register } from "vuex-module-validatable-state";

const initialFields = {
  amount: null,
  description: "default text"
};

const validators = {
  amount: [
    ({ amount }) => amount === null ? "Require this" : false
  ],
  description: [
    ({ description }) => description.length > 15 ? "Should be shorter than 15" : false,
    ({ description, amount }) => description.indexOf(amount.toString())  ? "Should include amount" : false,
  ]
};

const store = new Vuex.Store({
  modules: {
    myForm: {
      namespaced: true
      store,
      getters,
      actions,
      mutations
    }
  }
});

register(store, "myForm", initialFields, validators);
```
</details>

### Map to Components

#### Provided Getters

|**Getter name**|**Returns**|
---|---
|`GetterTypes.ALL_FIELDS_VALID`|`boolean` whether all fields don't have error|
|`GetterTypes.FIELD_VALUES`|All fields as `{ [fieldName]: value }`|
|`GetterTypes.FIELD_ERRORS`|All errors as `{ [fieldName]: errorMessage }`|
|`GetterTypes.FIELD_EDITABILITIES`|All editable flags as `{ [fieldName]: editability }`|
|`GetterTypes.FIELD_DIRTINESSES`|All dirtiness flags as `{ [fieldName]: dirtiness }`|
|`GetterTypes.ANY_FIELD_CHANGED`|`boolean` whether all fields are not dirty|

#### Provided Actions

Import `ActionTypes` from the module.

|**Action name**|**Runs**|
---|---
|`ActionTypes.SET_FIELD`|Set value for a field, then runs validation if enabled|
|`ActionTypes.SET_FIELDS_BULK`|Set values for fields at once, then make all dirtiness flags false|
|`ActionTypes.RESET_FIELDS`|Reset values on field with initial values|
|`ActionTypes.ENABLE_ALL_VALIDATIONS`|Enable interactive validation and run validations for all fields|
|`ActionTypes.VALIDATE_FIELD_VALUE`|Validate specific field|
|`ActionTypes.VALIDATE_FIELDS`|Validate all fields|
|`ActionTypes.SET_FIELDS_EDITABILITY`|Set editability flag for a field, disabled field is not updated nor validated|
|`ActionTypes.SET_FIELDS_PRISTINE`|Make all dirtiness flags false|

### Validators

You can pass validators when you initialize the module.

```ts
validators = {
  amount: [/* validators for filling error against to amount */],
  description: [/* validators for filling error against to description */]
}
```

Each validator can take all fields values to run validation:

```ts
  amount: [
    ({ amount, description }) => /* return false or errorMessage */
  ]
```

Optionally, can take getters on the store which calls this module:

```ts
  description: [
    ({ description }, getters) => getters.getterOnStore && validationLogicIfGetterOnStoreIsTruthy(description)
  ]
```

And you can request "interactive validation" which valites every time `dispatch(ActionTypes.SET_FIELD)` is called

```ts
  amount: [
    [({ amount }, getters) => /* validator logic */, { instant: true }]
  ]
```

### Provided Typings

You can import handy type/interface definitions from the module.
The generic `T` in below expects fields type like:

```ts
interface FieldValues {
  amount: number;
  description: string;
}
```

`getters[GetterTypes.FIELD_VALUES]` returns values with following `FieldValues` interface.

<details>
<summary>See all typings</summary>

#### `ValidatorTree<T>`

As like ActionTree, MutationTree, you can receive type guards for Validators. By giving your fields' type for Generics, validator can get more guards for each fields:

![image](https://user-images.githubusercontent.com/21182617/53462133-a174c300-39f7-11e9-9b73-a16e6f064193.png)

#### `SetFieldAction<T>`

It's the type definition of the payload for dispatching `ActionTypes.SET_FIELD`, you can get type guard for your fields by giving Generics.

![image](https://user-images.githubusercontent.com/21182617/53462201-dd0f8d00-39f7-11e9-81f8-a927a96c75b4.png)

#### `FieldValidationErrors<T>`

Type for `getters[GetterTypes.FIELD_ERRORS]`

#### `FieldEditabilities<T>`

Type for `getters[GetterTypes.FIELD_EDITABILITIES]`

#### `FieldDirtinesses<T>`

Type for `getters[GetterTypes.FIELD_DIRTINESSES]`

</details>

## Working Sample

[![Edit Sample: vuex-module-validatable-state](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/vue-template-o46g3?fontsize=14)

### Registering to Vuex Store

```js
const initialField = {
  amount: 0,
  description: null
};

const validators = {
  amount: [
    ({ amount }) => (!amount ? "Amount is required" : false),
    ({ amount }) => (amount <= 0 ? "Amount should be greater than 0" : false)
  ],
  description: [
    ({ amount, description }) =>
      amount > 1000 && !description
        ? "Description is required if amount is high"
        : false
  ]
};

const store = new Vuex.Store({
  modules: {
    ...theModule(initialField, validators)
  }
});
```

### Mapping to Component

```vue
<template>
  <form>
    <div>
      <label for="amount">Amount (Required, Positive)</label>
      <input type="number" name="amount" v-model="amount">
      <span v-if="errors.amount">{{ errors.amount }}</span>
    </div>
    <div>
      <label for="description">Description (Required if amount is greater than 1000)</label>
      <textarea name="description" v-model="description"/>
      <span v-if="errors.description">{{ errors.description }}</span>
    </div>
    <button @click.prevent="submit">Validate and Submit</button>
  </form>
</template>

<script>
import { GetterTypes, ActionTypes } from "vuex-module-validatable-state";

export default {
  name: "App",
  computed: {
    amount: {
      get() {
        return this.$store.getters[GetterTypes.FIELD_VALUES].amount;
      },
      set(value) {
        this.$store.dispatch(ActionTypes.SET_FIELD_VALUE, {
          name: "amount",
          value
        });
      }
    },
    description: {
      get() {
        return this.$store.getters[GetterTypes.FIELD_VALUES].description;
      },
      set(value) {
        this.$store.dispatch(ActionTypes.SET_FIELD_VALUE, {
          name: "description",
          value
        });
      }
    },
    errors() {
      return this.$store.getters[GetterTypes.FIELD_ERRORS];
    }
  },
  methods: {
    submit() {
      this.$store.dispatch(ActionTypes.ENABLE_ALL_VALIDATIONS).then(() => {
        if (this.$store.getters[GetterTypes.ALL_FIELDS_VALID]) {
          alert("Form is valid, so now submitting!");
          this.$store.dispatch(ActionTypes.SET_FIELDS_PRISTINE);
        }
      });
    }
  }
};
</script>
```
