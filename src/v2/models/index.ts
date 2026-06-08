// Re-export v1 models so v2 services don't need to reach back into v1 paths.
// v1 models are shared — they point to the same MongoDB collections.
export { Book } from '../../models/book';
export { Song } from '../../models/song';
export { User } from '../../models/user';
export { Draft } from '../../models/draft';
export { Edit } from '../../models/edit';
export { Listing } from '../../models/listing';
export { Organisation } from '../../models/organization';
export { Acounter } from '../../models/acounter';

// v2-only models
export { UserLike } from './userLike';
export { SongReport } from './songReport';
