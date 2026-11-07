import { describe, expect, test } from 'vitest';
import { parseCsvToDataPoints } from './csvToDataPoint';

// csvToDataPoints tests
describe('parseCsvToDataPoints', () => {
  // test case: empty file
  test('Returns an empty array for empty files', async () => {
    // use async as parseCsvToDataPoints is asynchronous
    const file = new File([''], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([]);
  });

  // test case: file with only blank lines
  test('Returns an empty array for files with only blank lines', async () => {
    const file = new File(['\n   \n\t\n'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([]);
  });

  // test case: file with one value
  test('Turns single value to data point', async () => {
    const file = new File(['10.125'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 0, value: 10.13, unit: 'm' }]);
  });

  // test case: file with two values
  test('Uses the smaller value as depth and the larger as timestamp', async () => {
    const file = new File(['1700000000,2.5'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 1700000000, value: 2.5, unit: 'm' }]);
  });

  // test case: file with columns in the opposite order
  test('Picks depth and timestamp regardless of column order', async () => {
    const file = new File(['2.5,1700000000'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 1700000000, value: 2.5, unit: 'm' }]);
  });

  // test case: file with more decimal places than needed
  test('Rounds depth to two decimal places but leaves timestamp unchanged', async () => {
    const file = new File(['1.23456,1700000000.789'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 1700000000.789, value: 1.23, unit: 'm' }]);
  });

  // test case: file with three values
  test('Turns multiple values to data point using the largest and smallest ones', async () => {
    const file = new File(['16.999, 145.04, 8.4'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 145.04, value: 8.4, unit: 'm' }]);
  });

  // test case: file with alternate separators
  test.each([
    ['commas', '16.999, 145.04, 8.4'],
    ['semicolons', '16.999; 145.04; 8.4'],
    ['tabs', '16.999\t145.04\t8.4'],
    ['mixed delimiters', '16.999;\t145.04, 8.4,'],
  ])('Parses values separated by %s', async (_name, line) => {
    const file = new File([line], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 145.04, value: 8.4, unit: 'm' }]);
  });

  // test case: file multiple lines
  test('Turns each line into a separate data point', async () => {
    const file = new File(['16.999, 145.04, 10\n64.34, 8.4'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([
      { timestamp: 145.04, value: 10, unit: 'm' },
      { timestamp: 64.34, value: 8.4, unit: 'm' },
    ]);
  });

  // test case: file with different line endings and blank lines
  test('Handles LF and CRLF line endings and skips blank lines', async () => {
    const file = new File(['100,1\r\n\r\n200,2\n\n300,3\r\n'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([
      { timestamp: 100, value: 1, unit: 'm' },
      { timestamp: 200, value: 2, unit: 'm' },
      { timestamp: 300, value: 3, unit: 'm' },
    ]);
  });

  // test case: file with rows out of timestamp order
  test('Preserves the order of rows from the file', async () => {
    const file = new File(['300,3\n100,1\n200,2'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([
      { timestamp: 300, value: 3, unit: 'm' },
      { timestamp: 100, value: 1, unit: 'm' },
      { timestamp: 200, value: 2, unit: 'm' },
    ]);
  });

  // test case: file with non numeric entry
  test('Turns multiple values to data point, ignoring non numeric entries', async () => {
    const file = new File(['16.999, ROV, Hydrobotics, True, 8.4'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 16.999, value: 8.4, unit: 'm' }]);
  });

  // test case: file with header row and a row with no numbers
  test('Skips lines without any numbers', async () => {
    const file = new File(['timestamp,depth\n100,1.5\nn/a,unknown\n200,2.5'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([
      { timestamp: 100, value: 1.5, unit: 'm' },
      { timestamp: 200, value: 2.5, unit: 'm' },
    ]);
  });

  // test case: file with negative depth
  test('Keeps negative depths as the smallest value', async () => {
    const file = new File(['100,-2.5'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 100, value: -2.5, unit: 'm' }]);
  });

  // test case: file with units attached to values
  test('Parses leading numbers from values with units', async () => {
    const file = new File(['100s,1.5m'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result).toEqual([{ timestamp: 100, value: 1.5, unit: 'm' }]);
  });

  // test case: file with rows of different lengths
  test('Always reports depth in metres', async () => {
    const file = new File(['1,10\n2,20\n3'], 'testData.csv');
    const result = await parseCsvToDataPoints(file);
    expect(result.every((point) => point.unit === 'm')).toBe(true);
  });
});
