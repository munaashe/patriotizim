import {
    all, call, put, select
} from 'redux-saga/effects';
import {
    ADD_TALES_COLLECTION,
    EDIT_TALES_COLLECTION,
    GET_TALES_COLLECTIONS,
    REMOVE_TALES_COLLECTION
} from 'src/constants/constants';
import { setLoading, setRequestStatus } from 'src/redux/actions/miscActions';
import firebase from 'src/config/firebase';
import {
    addTalesCollectionSuccess,
    editTalesCollectioneSuccess,
    getTalesCollectionsSuccess,
    removeTalesCollectionSuccess
} from 'src/redux/actions/talesCollectionsActions';

function* initRequest() {
    yield put(setLoading(true));
    yield put(setRequestStatus(null));
}

function* handleError(e) {
    yield put(setLoading(false));
    yield put(setRequestStatus(e?.message || 'Failed to fetch Tales Collections'));
    console.log('ERROR: ', e);
}


function* talesCollectionsSaga({ type, payload }) {
    switch (type) {
        case GET_TALES_COLLECTIONS:
            try {
                yield initRequest();
                const state = yield select();
                const result = yield call(firebase.getTalesCollections, payload);

                if (result.articles.length === 0) {
                    handleError('No items found.');
                } else {
                    yield put(getTalesCollectionsSuccess({
                        talesCollections: result.talesCollections,
                        lastKey: result.lastKey ? result.lastKey : state.talesCollections.lastRefKey,
                        total: result.total ? result.total : state.talesCollections.total
                    }));
                    yield put(setRequestStatus(''));
                }
                // yield put({ type: SET_LAST_REF_KEY, payload: result.lastKey });
                yield put(setLoading(false));
            } catch (e) {
                console.log(e);
                yield handleError(e);
            }
            break;

        case ADD_TALES_COLLECTION: {
            try {
                yield initRequest();

                const { imageCollection } = payload;
                const key = yield call(firebase.generateKey);
                const downloadURL = yield call(firebase.storeImage, key, 'articles', payload.image);
                const image = { id: key, url: downloadURL };
                let images = [];

                if (imageCollection.length !== 0) {
                    const imageKeys = yield all(imageCollection.map(() => firebase.generateKey));
                    const imageUrls = yield all(imageCollection.map((img, i) => firebase.storeImage(imageKeys[i](), 'articles', img.file)));
                    images = imageUrls.map((url, i) => ({
                        id: imageKeys[i](),
                        url
                    }));
                }

                const talesCollection = {
                    ...payload,
                    image: downloadURL,
                    imageCollection: [image, ...images]
                };

                yield call(firebase.addTalesCollection, key, talesCollection);
                yield put(addTalesCollectionSuccess({
                    id: key,
                    ...talesCollection
                }));
                yield put(setLoading(false));
            } catch (e) {
                yield handleError(e);
            }
            break;
        }
        case EDIT_TALES_COLLECTION: {
            try {
                yield initRequest();

                const { image, imageCollection } = payload.updates;
                let newUpdates = { ...payload.updates };

                if (image.constructor === File && typeof image === 'object') {
                    try {
                        yield call(firebase.deleteImage, payload.id);
                    } catch (e) {
                        console.error('Failed to delete image ', e);
                    }

                    const url = yield call(firebase.storeImage, payload.id, 'articles', image);
                    newUpdates = { ...newUpdates, image: url };
                }

                if (imageCollection.length > 1) {
                    const existingUploads = [];
                    const newUploads = [];

                    imageCollection.forEach((img) => {
                        if (img.file) {
                            newUploads.push(img);
                        } else {
                            existingUploads.push(img);
                        }
                    });

                    const imageKeys = yield all(newUploads.map(() => firebase.generateKey));
                    const imageUrls = yield all(newUploads.map((img, i) => firebase.storeImage(imageKeys[i](), 'articles', img.file)));
                    const images = imageUrls.map((url, i) => ({
                        id: imageKeys[i](),
                        url
                    }));
                    newUpdates = { ...newUpdates, imageCollection: [...existingUploads, ...images] };
                } else {
                    newUpdates = {
                        ...newUpdates,
                        imageCollection: [{ id: new Date().getTime(), url: newUpdates.image }]
                    };
                    // make sure you're adding the url not the file object.
                }

                yield call(firebase.editTalesCollection, payload.id, newUpdates);
                yield put(editTalesCollectioneSuccess({
                    id: payload.id,
                    updates: newUpdates
                }));
                yield put(setLoading(false));
            } catch (e) {
                yield handleError(e);
            }
            break;
        }
        case REMOVE_TALES_COLLECTION: {
            try {
                yield initRequest();
                yield call(firebase.removeTalesCollection, payload);
                yield put(removeTalesCollectionSuccess(payload));
                yield put(setLoading(false));
            } catch (e) {
                yield handleError(e);
            }
            break;
        }

        default: {
            throw new Error(`Unexpected action type ${type}`);
        }
    }
}

export default talesCollectionsSaga;