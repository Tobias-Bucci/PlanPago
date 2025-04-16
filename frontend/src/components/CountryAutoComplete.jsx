// src/components/CountryAutoComplete.jsx
import React, { useState, useRef, useEffect } from "react";

const ALL_COUNTRIES = [
  "Afghanistan",
  "Ägypten",
  "Albanien",
  "Algerien",
  "Andorra",
  "Angola",
  "Antigua und Barbuda",
  "Äquatorialguinea",
  "Argentinien",
  "Armenien",
  "Aserbaidschan",
  "Äthiopien",
  "Australien",
  "Bahamas",
  "Bahrain",
  "Bangladesch",
  "Barbados",
  "Belarus",
  "Belgien",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivien",
  "Bosnien und Herzegowina",
  "Botswana",
  "Brasilien",
  "Brunei",
  "Bulgarien",
  "Burkina Faso",
  "Burundi",
  "Chile",
  "China",
  "Costa Rica",
  "Dänemark",
  "Deutschland",
  "Dominica",
  "Dominikanische Republik",
  "Dschibuti",
  "Ecuador",
  "El Salvador",
  "Elfenbeinküste",
  "Eritrea",
  "Estland",
  "Eswatini",
  "Fidschi",
  "Finnland",
  "Frankreich",
  "Gabun",
  "Gambia",
  "Georgien",
  "Ghana",
  "Grenada",
  "Griechenland",
  "Großbritannien",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Indien",
  "Indonesien",
  "Irak",
  "Iran",
  "Irland",
  "Island",
  "Israel",
  "Italien",
  "Jamaika",
  "Japan",
  "Jemen",
  "Jordanien",
  "Kambodscha",
  "Kamerun",
  "Kanada",
  "Kap Verde",
  "Kasachstan",
  "Katar",
  "Kenia",
  "Kirgisistan",
  "Kiribati",
  "Kolumbien",
  "Komoren",
  "Kongo",
  "Kosovo",
  "Kroatien",
  "Kuba",
  "Kuwait",
  "Laos",
  "Lesotho",
  "Lettland",
  "Libanon",
  "Liberia",
  "Libyen",
  "Liechtenstein",
  "Litauen",
  "Luxemburg",
  "Madagaskar",
  "Malawi",
  "Malaysia",
  "Malediven",
  "Mali",
  "Malta",
  "Marokko",
  "Marshallinseln",
  "Mauretanien",
  "Mauritius",
  "Mexiko",
  "Mikronesien",
  "Moldau",
  "Monaco",
  "Mongolei",
  "Montenegro",
  "Mosambik",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Neuseeland",
  "Nicaragua",
  "Niederlande",
  "Niger",
  "Nigeria",
  "Nordkorea",
  "Nordmazedonien",
  "Norwegen",
  "Oman",
  "Österreich",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua-Neuguinea",
  "Paraguay",
  "Peru",
  "Philippinen",
  "Polen",
  "Portugal",
  "Ruanda",
  "Rumänien",
  "Russland",
  "Salomonen",
  "Sambia",
  "Samoa",
  "San Marino",
  "São Tomé und Príncipe",
  "Saudi-Arabien",
  "Schweden",
  "Schweiz",
  "Senegal",
  "Serbien",
  "Seychellen",
  "Sierra Leone",
  "Simbabwe",
  "Singapur",
  "Slowakei",
  "Slowenien",
  "Somalia",
  "Spanien",
  "Sri Lanka",
  "St. Kitts und Nevis",
  "St. Lucia",
  "St. Vincent und die Grenadinen",
  "Südafrika",
  "Sudan",
  "Südkorea",
  "Südsudan",
  "Suriname",
  "Syrien",
  "Tadschikistan",
  "Taiwan",
  "Tansania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad und Tobago",
  "Tschad",
  "Tschechien",
  "Tunesien",
  "Türkei",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "Ungarn",
  "Uruguay",
  "Usbekistan",
  "Vanuatu",
  "Vatikanstadt",
  "Venezuela",
  "Vereinigte Arabische Emirate",
  "Vereinigte Staaten",
  "Vietnam",
  "Zentralafrikanische Republik",
  "Zypern"
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
