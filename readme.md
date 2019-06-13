# react-redux-usingducks
### __An action centric approach to redux-ducks__

[![Build Status](https://img.shields.io/travis/german-p/react-redux-usingducks.svg)](https://travis-ci.org/german-p/react-redux-usingducks) 

_If you are unfamiliar to what a ducks is, please refer to the specs here: https://github.com/erikras/ducks-modular-redux_

>This implementation is using [react-redux-async-action](https://www.npmjs.com/package/react-redux-async-action) so it uses the _FAILURE and _SUCCESS action suffix convention. See that package readme for more info.

## Installation:

```
npm install react-redux-usingducks
```

```
yarn add react-redux-usingducks
```


## Motivation

Having worked on a modular redux application, I quickly noticed how out of hand the file structure got very quickly: actions, actionTypes, reducers, sagas, selectors... specially when each "container" component had their own set of those files  
Adding a new action meant touching several files, and trying to find the code related to an action meant browsing over a lot of files and folders.  

[Ducks](https://github.com/erikras/ducks-modular-redux) approach helped a lot in that regard, but I wanted to have an implementation where the action creator and the reduce function were close to each other, so i could see all the information about the action in the same place.
I have also never been a fan of those long switch statements for the reducer function which could get very complex at times.

A very common scenario I run into often is whenever I have to use an action to fetch data:
  1) Make the api call
  2) Track the "_isLoading_" flag for the call in the reducer (for loading spinners)
  3) If the api call returned successfully handle that in the reducer to save the data to the store and set "_isLoading_" back to false
  3) If the api call failed set "_isLoading_" back to false in the store and optionally modify the store based on the error

## Example

Let's consider a very simple scenario where we want to fetch some data and track the call duration for a spinner in the UI

```js
// ducks.js
import { success, failure } from 'react-redux-async-action';

const FETCH_SAMPLE_LIST = '[sample] FETCH_SAMPLE_LIST';

export const fetchSampleList = (param1) => ({
  type: FETCH_SAMPLE_LIST,
  payload: param1,
});

const initialState = {
  loadingData: false,
  items: [],
};
// duck reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_SAMPLE_LIST:
      return { ...state, loadingData: true };
    case success(FETCH_SAMPLE_LIST):
      return {...state, loadingData: false, items: action.payload };
    case failure(FETCH_SAMPLE_LIST):
      return { ...state, loadingData: false, lastError: action.error };
    default:
      return state;
  }
};
```

### How does it look with this implementation?

```js
import usingDucks from 'react-redux-usingducks';

const { makeActionCreator, createReducer } = usingDucks({
  items: [],
}, 'sample');

export const fetchSampleList = makeActionCreator({
  type: 'FETCH_SAMPLE_LIST',
  trackWith: 'loadingData',
  successReducer: (state, payload) => ({ ...state, items: payload }),
  failureReducer: (state, payload, error) => ({ ...state, lastError: error }),
});

export default createReducer();
```

## So how does it work?

**```usingDucks```** creates a context (or duck) that allows for the creation of actions that will be logically grouped, the group can be a component, a module, the application, etc.  
After all the actions you want are created you can simply export the reducer as default export as indicated in the ducks specification. You can then use this export in your combineReducers on your root reducer
>This library does not require any middlewares, or the way you create your store or any other boilerplate it's centered on the action type/action creator/reducer combo

### Usage
```js
const duck = usingDucks(initialState, namespace);
```
  |parameter|type|required|default|description|
  |---------|----|--------|-------|-----------|
 |**initialState**|```any```|no|```{ }```|The initial state to use for the reducer generated by this duck|
 |**namespace**|```string```|no|```undefined```|_(Optional)_ The name of the logical grouping of the actions of this duck. This string will be prefixed to every action exported by this duck for easier tracking in redux dev tools.|

#### Returns
  An object with the following properties:

  * ```makeActionCreator``` (function)
  * ```createReducer``` (function)
  * ```reduce``` (function)


# makeActionCreator

>Creates an action creator and register the reducers that will handle the action.

```js
export const myAction = makeActionCreator(actionDefinition);
```
Takes a single ```object``` parameter with the following properties:

|property|type|required|example|description|
|--------|----|--------|-------|-----------|
|type|```string```|yes|'FETCH_DATA'|The action type constant|
|trackWith|```string``` <br>```function```|no|'isLoading'<br>(state, payload, isRunning)=> ({...state, loadingData: isRunning})|The name of the store property that will track the running state of this async action or a function that will update the store with it|
|reducer|```function```|no|(state, payload)=> ({ ...state, data: payload })|The reducer function that will be executed when this action is dispatched|
|successReducer|```function```|no|(state, payload)=> ({ ...state, data: payload })|The reducer function when this is an async action and the call succeeds (state, payload)=> state|
|failureReducer|```function```|no|(state, payload, error)=> ({ ...state, lastError: error.message })|The reducer function when this is an asyuc action and the call throws an exception|

## Examples

## **Creating a simple action creator**

```js
export const setUser = makeActionCreator({ type: 'SET_USER' });
```
```setUser``` is a function that takes a single parameter called payload and returns an action object:
```js
(payload)=> ({ type: 'SET_USER', payload });
```

## **Creating an action that modifies the store when dispatched**
```js
export const setUser = makeActionCreator({
  type: 'SET_USER',
  reducer: (state, payload)=> ({...state, userName: payload.name }),
});

// e.g.
dispatch(setUser({ name: 'Peter', age: 25 }));
```

## **Creating an async action that loads data to the store when it finishes**
```js
export const fetchData = makeActionCreator({
  type: 'FETCH_DATA',
  successReducer: (state, payload)=> ({...state, data: payload }),
});

// e.g. this would be dispatched from a thunk or a saga after the api call
const restApiResult = [1, 2, 3];
dispatch(success(fetchData(restApiResult)));
```

If you are using thunks, [react-redux-async-action](https://www.npmjs.com/package/react-redux-async-action) provides with a helper method ```asThunk``` that allows you to convert an action creator into a thunk for this scenario. Refer to the [package's readme](https://www.npmjs.com/package/react-redux-async-action) for details

```js
import api from './api';
//...
export const fetchDataThunk = asThunk(fetchData, (payload)=> api.makeRestCall(payload));
```

For sagas i was planning on having a similar function to ```asThunk``` but I wanted to keep dependencies to a minimum; I might create a package for it if it becomes repetitive enough

```js
import api from './api';
import { take, call, put } from 'redux-saga/effects';
//...
function* fetchDataSaga() {
  while (true) {
    const action = take(fetchData().type); // see NOTE
    try {
      const restApiResult = yield call(api.makeRestCall, action.payload);
      yield put(success(fetchData(restApiResult)));
    } catch (err) {
      yield put(failure(fetchData(action.payload), err)); // we dispatch the _FAILURE error with the original payload so we know what parameters were used when the action failed.
    }
  }
}

```
> NOTE: I'm using **```fetchData().type```** instead of extracting the ```type``` property in the action definition into a constant and using that as a practice since the duck might have a namespace that will affect the action string type value

## **Creating an async action that tracks its duration in the store**

This is helpful when you want to show a connected spinner while your data loads for example
Imagine that we have a list of TODOs in the UI that can be edited, so when the user clicks on the save button we show an overlay until the save is complete

There are 2 ways to do this:
* For the simple scenario you simply set the name you want to call the boolean loading flag to the ```trackWith``` property:

```js
export const updateTodo = makeActionCreator({
  type: 'UPDATE_TODO',
  trackWith: 'isUpdatingTodo',
});
```
This will set the ```store.isUpdatingTodo``` to ```true``` when the action is dispatched and back to ```false``` whenever it finishes (no matter if _SUCCESS or _FAILURE) and we can use that to show/hide our overlay

* For a more complex case, trackWith also accepts a function wich is quite similar to a reducer:

Let's say for the previous example that we are asked that the UI allows us to edit another TODO in the list while one is still updating, so we decide to show make a spinner on each TODO component individually.
We now need the list of TODOS that are being updated, so we decide that we will track this with an array on the store with the ids of the TODOs being updated. Once they finish we will remove that id from the array
```js
state.todosBeingUpdated = [];
```

For this we can do the following:

```js
const updateTodo = makeActionCreator({
  type: 'UPDATE_TODO',
  trackWith: (state, payload, isRunning) => {
    if (!isRunning) { 
      // remove the todo.id being updated
      return {...state, todosBeingUpdated: state.todosBeingUpdated.filter(x=> x!== payload.id) };
    }
    if(!state.todosBeingUpdated.includes(payload.id))
      return { ...state, todosBeingUpdated: [...state.todosBeingUpdated, payload.id] };
    return state;
  },
});

// example of action dispatch:
import api from './api';

export const updateTodoThunk = asThunk(updateTodo, api.updateTodo);
const payload = { id: 1, todoText: 'Write readme file', done: false };
dispatch(updateTodoThunk(payload));
```


## **Creating an async action that updates the store with the error when it fails**

```js
export const fetchData = makeActionCreator({
  type: 'FETCH_DATA',
  failureReducer: (state, payload, error)=> ({...state, lastError: error.message }),
});

// e.g. this would be dispatched from a thunk or a saga after the api call
//...
catch (error) {
  dispatch(failure(fetchData(payload), error));
}
```

## Immutability

All internal reducer functions created for this lib (e.g. ```trackWith```) deal with store changes in an immutable way. I'm not using any library for it, just plain old javascript. If you want to use an immutable lib on your reducers i'd go for [immer](https://www.npmjs.com/package/immer), since it also accepts functions that return a value and that makes it compatible with the ```trackWith``` internal reducer.

You can use the currying option for a painless implementation:
```js
import produce from 'immer';

export const fetchData = makeActionCreator({
  type: 'FETCH_DATA',
  successReducer: produce((state, payload)=> {
    state.data = payload; 
  }),
});
```

This allows you to only use it on reducers that get too complex for plain javascript immutability
Please refer to the [immer](https://www.npmjs.com/package/immer) documentation for more info

I have not tested [Immutable.JS](https://www.npmjs.com/package/immutable) with this quite yet



# createReducer
>Creates the main reducer function for the actions of the duck
```js
const reducer = createReducer();
```
#### Returns
  The reducer function for the ducks

# reduce
>Registers a reducer to execute when a specified action or an action matching certain criteria is dispatched.  

This function is only neccesary when you want to reduce actions defined outside this ducks.
```js
reduce(actionType, reducer);
reduce(actionMatchCondition, reducer);
```
|parameter|type|required|description|example|
|---------|----|--------|-----------|-------|
|actionType<br>actionMatchCondition|```string```<br>```function```|yes|The action string constant to reduce<br>A function that accepts an action and returns true if it should be reduced|'EXTERNAL_ACTION'<br>(action)=> action.type.endsWith('_FAILURE')
|reducer|```function```|yes|The reducer function that will run when the action is dispatched|(state, payload, error) => ({...state, data: payload, lastError: error })|

