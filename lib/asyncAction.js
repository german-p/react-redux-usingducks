
function appendSuffix(action, suffix, error) {
  if (typeof action === 'string')
    return `${action}_${suffix}`;
  if (Reflect.has(action, 'type'))
    return { ...action, type: `${action.type}_${suffix}`, error: error && { stack: error.stack, message: error.message } };
  return action;
}
/**
 * Takes an action string constant or action object and returns its success counterpart
 * @param {string|object} action The action constant or an action object
 * @returns The success action
 */
module.exports.success = (action)=> appendSuffix(action, 'SUCCESS');

/**
 * Takes an action string constant or action object and returns its failure counterpart
 * @param {string|object} action The action constant or an action object
 * @returns The failure action
 */
module.exports.failure = (action, error)=> appendSuffix(action, 'FAILURE', error);
