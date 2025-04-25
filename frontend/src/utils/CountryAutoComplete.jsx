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

export default function CountryAutoComplete({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (!val) { setSuggestions([]); setOpen(false); return; }
    const list = ALL_COUNTRIES.filter(c =>
      c.toLowerCase().startsWith(val.toLowerCase())
    );
    setSuggestions(list); setOpen(true);
  };
  const handleSelect = c => { onChange(c); setSuggestions([]); setOpen(false); };

  useEffect(()=>{
    const click=(e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",click); return()=>document.removeEventListener("mousedown",click);
  },[]);

  return (
    <div className="relative" ref={ref}>
      <input
        className="frosted-input"
        placeholder="Country"
        value={value}
        onChange={handleInputChange}
      />
      {open && suggestions.length>0 && (
        <ul className="absolute z-20 w-full max-h-40 overflow-y-auto glass-card backdrop-blur-sm">
          {suggestions.map(c=>(
            <li
              key={c}
              onClick={()=>handleSelect(c)}
              className="px-3 py-1 hover:bg-white/10 cursor-pointer"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}