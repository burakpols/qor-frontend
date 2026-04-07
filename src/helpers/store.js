import { legacy_createStore as createStore, applyMiddleware } from "redux";
import {thunk} from 'redux-thunk';
import { createLogger } from "redux-logger";

import rootReducer from '../reducers/rootReducer';

const loggerMiddleware = createLogger();

const store = createStore(rootReducer, applyMiddleware(thunk, loggerMiddleware));

export default store;