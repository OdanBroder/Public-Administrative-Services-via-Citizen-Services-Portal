import lib from '../ffi/external.js';

// Example function to add numbers
export const addNumbers = (req, res) => {
    const result = lib.addNumbers(5, 3);
    res.json({ result });
}; 