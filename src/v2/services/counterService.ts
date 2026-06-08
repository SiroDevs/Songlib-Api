import { Acounter } from '../models';

/**
 * Atomically increments a named counter and returns the NEW value.
 *
 * v1 bug: it did getNextSequence() then incrementSequence() as two
 * separate DB calls. Under concurrent requests two callers could read
 * the same seq before either incremented it, producing duplicate IDs.
 *
 * Fix: findOneAndUpdate with $inc in a single atomic operation.
 * { new: true } returns the document AFTER the increment, so the
 * returned seq is the unique ID to use.
 */
export class CounterService {
  static async getNextId(counterName: string): Promise<number> {
    const counter = await Acounter.findOneAndUpdate(
      { _id: counterName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!counter) {
      throw new Error(`Counter "${counterName}" could not be initialised`);
    }

    return counter.seq;
  }
}
