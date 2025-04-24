// src/components/CountryAutoComplete.jsx
import React, { useState, useRef, useEffect } from "react";

const ALL_COUNTRIES = [
  "Afghanistan",
  "Egypt",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Equatorial Guinea",
  "Argentina",
  "Armenia",
  "Azerbaijan",
  "Ethiopia",
  "Australia",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Chile",
  "China",
  "Costa Rica",
  "Denmark",
  "Germany",
  "Dominica",
  "Dominican Republic",
  "Djibouti",
  "Ecuador",
  "El Salvador",
  "Ivory Coast",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Ghana",
  "Grenada",
  "Greece",
  "United Kingdom",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "India",
  "Indonesia",
  "Iraq",
  "Iran",
  "Ireland",
  "Iceland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Yemen",
  "Jordan",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Kazakhstan",
  "Qatar",
  "Kenya",
  "Kyrgyzstan",
  "Kiribati",
  "Colombia",
  "Comoros",
  "Congo",
  "Kosovo",
  "Croatia",
  "Cuba",
  "Kuwait",
  "Laos",
  "Lesotho",
  "Latvia",
  "Lebanon",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Morocco",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "New Zealand",
  "Nicaragua",
  "Netherlands",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Austria",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Rwanda",
  "Romania",
  "Russia",
  "Solomon Islands",
  "Zambia",
  "Samoa",
  "San Marino",
  "São Tomé and Príncipe",
  "Saudi Arabia",
  "Sweden",
  "Switzerland",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Zimbabwe",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Somalia",
  "Spain",
  "Sri Lanka",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "South Africa",
  "Sudan",
  "South Korea",
  "South Sudan",
  "Suriname",
  "Syria",
  "Tajikistan",
  "Taiwan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Chad",
  "Czech Republic",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "Hungary",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "United Arab Emirates",
  "United States",
  "Vietnam",
  "Central African Republic",
  "Cyprus"
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
        placeholder="Country"
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
