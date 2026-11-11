import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSaveQueue } from '../src/domain/saveQueue.ts'

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

test('REQ-003 saveQueue: requests made while a save is running collapse into exactly one more run, never overlapping', async () => {
  let running = 0
  let maxRunning = 0
  let runs = 0
  let release: () => void = () => {}
  const queue = createSaveQueue(async () => {
    runs += 1
    running += 1
    maxRunning = Math.max(maxRunning, running)
    await new Promise<void>((resolve) => { release = resolve })
    running -= 1
  })
  const first = queue.request()
  await tick()
  void queue.request()
  void queue.request()
  void queue.request()
  release()
  await tick()
  release()
  await first
  assert.equal(runs, 2)
  assert.equal(maxRunning, 1)
})

test('REQ-003 saveQueue: a request after the queue went idle runs again', async () => {
  let runs = 0
  const queue = createSaveQueue(async () => { runs += 1 })
  await queue.request()
  await queue.request()
  assert.equal(runs, 2)
})

test('REQ-003 saveQueue: a failing run does not wedge the queue', async () => {
  let runs = 0
  const queue = createSaveQueue(async () => {
    runs += 1
    if (runs === 1) throw new Error('boom')
  })
  await assert.rejects(queue.request(), /boom/)
  await queue.request()
  assert.equal(runs, 2)
})
