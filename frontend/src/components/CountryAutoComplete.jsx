// src/components/CountryAutoComplete.jsx
import React, { useState, useRef, useEffect } from "react";

const ALL_COUNTRIES = [
  "Deutschland",
  "Österreich",
  "Schweiz",
  "Frankreich",
  "Italien",
  "Spanien",
  "Vereinigte Staaten",
  "Kanada",
  "Großbritannien",
  "Polen",
  // Weitere Länder nach Bedarf
];

function CountryAutoComplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    if (!inputValue) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    const filtered = ALL_COUNTRIES.filter((country) =>
      country.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    setSuggestions(filtered);
    setIsOpen(true);
  };

  const handleSelect = (country) => {
    onChange(country);
    setSuggestions([]);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        className="w-full border p-2 rounded"
        value={value}
        onChange={handleInputChange}
        placeholder="Land"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto rounded shadow">
          {suggestions.map((country) => (
            <li
              key={country}
              onClick={() => handleSelect(country)}
              className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
            >
              {country}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CountryAutoComplete;
