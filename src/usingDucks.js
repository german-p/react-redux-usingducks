const { success, failure } = require('./asyncAction');

function usingDucks(name, initialState = {}) {
  if(!name) throw new Error('Please provide a name for the duck');
  const config = {};
  /**
   * Creates an action creator and register the reducers that will handle the action.
   * @param {string} type The action type constant
   * @param {object} options The object with the optional parameters
   * @param {function} options.reducer The reducer function that will be executed when this action is dispatched.
   * @param {function} options.successReducer The reducer function when this is an async action and the call succeeds (does not fail)
   * (state, payload)=> state
   * @param {function} options.failureReducer The reducer function when this is an asyuc action and the call throws an exception.
   * (state, payload, error)=> state
  */
  function newActionCreator(type, options) {
    if(!type) throw new Error('The type parameter is required');

    if(options) {
      const { reducer, successReducer, failureReducer } = options;
      reduce(type, reducer);
      reduce(success(type), successReducer);
      reduce(failure(type), failureReducer);
    }
    return (payload)=> ({ type, payload });
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


  /**
   * Creates the main reducer function for the actions of the duck
   * @returns the reducer function (state, action)=> state;
   */
  function createReducer() {
    return (state = initialState, action)=> {
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