
function appendSuffix(action, suffix, error) {
  if (typeof action === 'string')
    return `${action}_${suffix}`;
  if (Reflect.has(action, 'type')) {
    const a = { ...action, type: `${action.type}_${suffix}` };
    if(error) a.error = { stack: error.stack, message: error.message };
    return a;
  }
  return action;
}

/**
 * Takes an action string constant or action object and returns its success counterpart
 * @param {string|object} action The action constant or an action object
 * @returns The success action
 */
function success(action) { return appendSuffix(action, 'SUCCESS') };

/**
 * Takes an action string constant or action object and returns its failure counterpart
 * @param {string|object} action The action constant or an action object
 * @returns The failure action
 */
function failure(action, error) { return appendSuffix(action, 'FAILURE', error); }


/**
 * Creates a redux thunk for an action creator and an async call.
 * Success or Failure variants of the action will be dispatched upon completion.
 * @param {function} actionCreator the function that creates the action (payload)=> ({ type, payload });
 * @param {function} asyncCall The async function to execute when the action is dispatched. Its return value will be the payload on the success reducer: async (payload)=> { return successReducerPayload }
 * @param {function} afterSuccess The function to execute after the action succeeds. (action, result, dispatch)=> {}
 * @param {function} afterFailure The function to execute after the action fails. (action, error, dispatch)=> {}
 * @returns The redux thunk for the action
 */
function asThunk(actionCreator, asyncCall, afterSuccess, afterFailure) {
  return (payload) => async dispatch => {
      const action = actionCreator(payload);
      dispatch(action);
      let result;
      try {
        result = await asyncCall(payload);
        dispatch(success(actionCreator(result)));
      } catch (error) {
        dispatch(failure(action, error));
        if(afterFailure)  afterFailure(action, error, dispatch);
        return;
      }
      if(afterSuccess) afterSuccess(action, result, dispatch);
  };
}

module.exports = {
  success,
  failure,
  asThunk,
};
