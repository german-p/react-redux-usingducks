
function usingDucks(initialState) {
  const config = {};

  function newActionCreator(type, options) {
    if(!type) throw new Error('The type parameter is required');

    if(options) {
      const { reducer } = options;
      reduce(type, reducer);
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