import {
    applyMiddleware,
    compose, createStore
} from 'redux';
import { persistCombineReducers, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import createSagaMiddleware from 'redux-saga';

import rootReducer from '../reducers';
import rootSaga from '../sagas/rootSaga';

const sagaMiddleware = createSagaMiddleware();

const authPersistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth', 'profile', 'basket', 'checkout']
};

export default () => {
    const store = createStore(
        persistCombineReducers(authPersistConfig, rootReducer),
    );
    const persistor = persistStore(store);
    sagaMiddleware.run(rootSaga);
    return { store, persistor };
};