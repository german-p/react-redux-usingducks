const { success, failure } = require('./asyncAction');

function usingDucks(initialState = {}, namespace) {
  const config = {};
  const conditionalReducers = [];
  let _initialState = initialState;
  if(namespace && typeof namespace !== 'string') throw new Error('The namespace must be a string');
  /**
   * Creates an action creator and register the reducers that will handle the action.
   * @param {object} definition The object with the action definition parameters
   * @param {string} definition.type (required) The action type constant
   * @param {function} definition.reducer The reducer function that will be executed when this action is dispatched.
   * @param {function} definition.successReducer The reducer function when this is an async action and the call succeeds (does not fail)
   * (state, payload)=> state
   * @param {function} definition.failureReducer The reducer function when this is an asyuc action and the call throws an exception.
   * (state, payload, error)=> state
  */
  function newActionCreator(definition) {
    if(!definition) throw new Error('The action definition parameter is required');
    if(!definition.type) throw new Error('The action definition must have a value for type');
    if(typeof definition.type !== 'string') throw new Error('The action definition type must be a string');
    const { type, reducer, successReducer, failureReducer, trackWith} = definition;
    
    const actionType = namespace ? `[${namespace}] ${type}` : type;
    const reducerFn = composeTrackWith(reducer, actionType, trackWith, true);
    if (reducerFn) reduce(actionType, reducerFn);
    const successReducerFn = composeTrackWith(successReducer, actionType, trackWith, false)
    if (successReducerFn) reduce(success(actionType), successReducerFn);
    const failureReducerFn = composeTrackWith(failureReducer, actionType, trackWith, false);
    if (failureReducerFn) reduce(failure(actionType), failureReducerFn);
    
    return (payload)=> ({ type: actionType, payload });
  }

  /**
  * Registers a reducer to execute when the specified action is dispatched.
  * Expected function (state, payload, error) => state;
  * @param {string} actionType The action type constant
  * @param {function} reducerFn The reducer function that will handle this action
  */
  function reduce(actionType, reducerFn) {
    const ns = namespace ? ` [${namespace}]` : '';
    if(typeof actionType === 'string') {
      if(config[actionType])
      throw new Error(`${actionType} is already being reduced by this${ns} duck. Unify your reducer code in the action definition reducer`);
      if(!reducerFn)
        throw new Error(`The reducer function argument for ${actionType} reduce is required`);
      if (reducerFn) { config[actionType] = reducerFn; }
    } else if (typeof actionType === 'function') {
      conditionalReducers.push({ actionCondition: actionType, reducer: reducerFn });
    } else {
      throw new Error('actionType parameter must be a string or a function');
    }
  }

  const isFunction = obj=> !!(obj && obj.constructor && obj.call && obj.apply);
  function composeTrackWith(reducer, type, trackWith, isRunning) {
    if (!trackWith) return reducer;
    const trackWithIsAFunction = isFunction(trackWith);
    if(!trackWithIsAFunction) _initialState = {...initialState, [trackWith]: false };
    else _initialState = trackWith(initialState, undefined, false);

    return (state, payload)=> {
      let nextState = state;

      if (trackWithIsAFunction) {
        nextState = trackWith(state, payload, isRunning);
        if(!nextState) throw new Error(`trackWith function of the ${type} action should return a state object`)
      } else {
        nextState = ({...state, [trackWith]: isRunning});
      }
      if(reducer) return reducer(nextState);
      return nextState;
    }
  }



  /**
   * Creates the main reducer function for the actions of the duck
   * @returns the reducer function (state, action)=> state;
   */
  function createReducer() {
    return (state = _initialState, action)=> {
      let newState = state;
      if (action && action.type) {
        if(config[action.type]) {
          newState = config[action.type](state, action.payload/*, action.error*/);
          if(!newState) throw new Error(`The reducer of the ${action.type} action does not return a state object`);
        }
        return conditionalReducers.reduce((state, conditional)=> {
          if(conditional.actionCondition(action) === true) {
            return conditional.reducer(state);
          }
        }, newState);
      }
      return state;
      
    };
  }

  return { newActionCreator, createReducer, reduce };
};


module.exports = {
  usingDucks,
}