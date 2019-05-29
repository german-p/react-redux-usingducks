const { success, failure } = require('./asyncAction');

function usingDucks(initialState = {}, namespace) {
  const config = {};
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
    reduce(actionType, composeTrackWith(reducer, actionType, trackWith, true));
    reduce(success(actionType), composeTrackWith(successReducer, actionType, trackWith, false));
    reduce(failure(actionType), composeTrackWith(failureReducer, actionType, trackWith, false));
    
    return (payload)=> ({ type: actionType, payload });
  }

  /**
  * Registers a reducer to execute when the specified action is dispatched.
  * Expected function (state, payload, error) => state;
  * @param {string} actionType The action type constant
  * @param {function} reducerFn The reducer function that will handle this action
  */
  function reduce(actionType, reducerFn) {
    // TODO: handle if already exists
    if (reducerFn) { config[actionType] = reducerFn; }
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
      if (action && action.type && config[action.type]) {
        const newState = config[action.type](state, action.payload/*, action.error*/);
        if(!newState) throw new Error(`The reducer of the ${action.type} action does not return a state object`);
        return newState;
      }
      return state;
    };
  }

  return { newActionCreator, createReducer };
};


module.exports = {
  usingDucks,
}