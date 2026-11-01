import { expect, test } from 'vitest';
import { parseCsvToDataPoints } from './csvToDataPoint';

// csvToDataPoints tests

// test case: empty file
test('Returns null vales for empty files ', async () => {
  // use async as parseCsvToDataPoints is asynchronous
  const file = new File([''], 'testData.csv');
  const result = await parseCsvToDataPoints(file);
  expect(result).toEqual([]);
});

// test case: file with one value
test('Turns single value to data point ', async () => {
  // use async as parseCsvToDataPoints is asynchronous
  const file = new File(['10.125'], 'testData.csv');
  const result = await parseCsvToDataPoints(file);
  expect(result).toEqual([{ timestamp: 0, value: 10.13, unit: 'm' }]);
});

// test case: file with three values
test('Turns multiple values to data point using the largest and smallest ones ', async () => {
  const file = new File(['16.999, 145.04, 8.4'], 'testData.csv');
  const result = await parseCsvToDataPoints(file);
  expect(result).toEqual([{ timestamp: 145.04, value: 8.4, unit: 'm' }]);
});

// test case: file with alternate seperator
test('Parses values separated by semicolons  ', async () => {
  const file = new File(['16.999; 145.04; 8.4'], 'testData.csv');
  const result = await parseCsvToDataPoints(file);
  expect(result).toEqual([{ timestamp: 145.04, value: 8.4, unit: 'm' }]);
});

// test case: file multiple lines
test('Turns each line into a seperate data point ', async () => {
  const file = new File(['16.999, 145.04, 10\n64.34, 8.4'], 'testData.csv');
  const result = await parseCsvToDataPoints(file);
  expect(result).toEqual([
    { timestamp: 145.04, value: 10, unit: 'm' },
    { timestamp: 64.34, value: 8.4, unit: 'm' },
  ]);
});

// test case: file with non numeric entry
test('Turns multiple values to data point, ignoring non numeric entries ', async () => {
  const file = new File(['16.999, ROV, Hydrobotics, True, 8.4'], 'testData.csv');
  const result = await parseCsvToDataPoints(file);
  expect(result).toEqual([{ timestamp: 16.999, value: 8.4, unit: 'm' }]);
});

// mqqttClient tests
