import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import './App.css'

const DEBUG = false; // Set this to true to show logs, false to hide them

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [hairstyles, setHairstyles] = useState([]);
  const [userSelections, setUserSelections] = useState({
    faceShape: '',
    hairType: '',
    hairDensity: '',
    foreheadSize: '',
    recedingHairline: '',
    skinColor: '',
    continent: '',
    ageRange: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState([]);

  // Define steps with their options
  const steps = [
    {
      name: 'Face Shape',
      key: 'faceShape',
      weight: 30,
      options: ['Oval', 'Square', 'Round', 'Diamond', 'Heart', 'Oblong', 'Triangle']
    },
    {
      name: 'Hair Type',
      key: 'hairType',
      weight: 20,
      options: ['Straight', 'Wavy', 'Curly', 'Coily']
    },
    {
      name: 'Hair Density',
      key: 'hairDensity',
      weight: 15,
      options: ['Thin', 'Medium', 'Thick']
    },
    {
      name: 'Forehead Size',
      key: 'foreheadSize',
      weight: 10,
      options: ['Small (< 3 inches)', 'Medium (3-4 inches)', 'Big (> 4 inches)']
    },
    {
      name: 'Receding Hairline',
      key: 'recedingHairline',
      weight: 10,
      options: ['Yes', 'No']
    },
    {
      name: 'Skin Color',
      key: 'skinColor',
      weight: 5,
      options: ['White', 'Brown', 'Black', 'Any']
    },
    {
      name: 'Continent',
      key: 'continent',
      weight: 5,
      options: ['Western', 'Europe', 'Asia', 'Africa', 'North America', 'Any']
    },
    {
      name: 'Age Range',
      key: 'ageRange',
      weight: 5,
      options: ['< 20s', '20s', '30s', '40s', '50+']
    }
  ];

  // Load the CSV data when component mounts
  useEffect(() => {
    fetch('/hairstyle-guide.csv')
      .then(response => response.text())
      .then(csvData => {
        const { data } = Papa.parse(csvData, { header: true });
        setHairstyles(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading hairstyle data:', error);
        setLoading(false);
      });
  }, []);

  // Handle option selection
  const handleOptionSelect = (option) => {
    const updatedSelections = {
      ...userSelections,
      [steps[currentStep].key]: option
    };
    setUserSelections(updatedSelections);
    
    // If this is the last step, calculate results and move to results view
    if (currentStep === steps.length - 1) {
      calculateResults(updatedSelections);
      setCurrentStep(currentStep + 1);
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to check if an age falls within a range
  const isAgeInRange = (selectedAge, rangeStr) => {
    // Clean and normalize the range string
    const normalizedRange = rangeStr.toLowerCase().trim();
    
    // Handle 'any' case (case insensitive)
    if (normalizedRange === 'any') {
      return true;
    }

    // Convert selected age to numeric range
    let selectedMin, selectedMax;
    if (selectedAge === '< 20s') {
      selectedMin = 13; // Assuming teens start at 13
      selectedMax = 19;
    } else if (selectedAge === '20s') {
      selectedMin = 20;
      selectedMax = 29;
    } else if (selectedAge === '30s') {
      selectedMin = 30;
      selectedMax = 39;
    } else if (selectedAge === '40s') {
      selectedMin = 40;
      selectedMax = 49;
    } else if (selectedAge === '50+') {
      selectedMin = 50;
      selectedMax = 100;
    }

    // Parse the range string, handling multiple ranges
    const ranges = normalizedRange.split(',').map(r => r.trim());
    
    return ranges.some(range => {
      // Handle "teens" cases (e.g., "teens-30s", "teens")
      if (range.includes('teens')) {
        if (range.includes('-')) {
          // Handle ranges like "teens-30s"
          const endAge = range.split('-')[1];
          const endNum = parseInt(endAge) || 39; // if it ends with "30s", use 39
          return selectedMin < 20 || selectedMax <= endNum;
        }
        return selectedMin < 20;
      }
      
      // Handle "+" ranges (e.g., "18+", "50+")
      if (range.includes('+')) {
        const min = parseInt(range);
        return !isNaN(min) && selectedMin >= min;
      }
      
      // Handle numeric ranges (e.g., "18-50", "20-40")
      if (range.includes('-')) {
        const [minStr, maxStr] = range.split('-');
        const min = parseInt(minStr);
        const max = parseInt(maxStr);
        if (!isNaN(min) && !isNaN(max)) {
          return selectedMin <= max && selectedMax >= min;
        }
      }

      return false;
    });
  };

  // Helper function to normalize forehead size
  const normalizeForeheadSize = (size) => {
    if (size.includes('Small')) return 'Small';
    if (size.includes('Medium')) return 'Medium';
    if (size.includes('Big')) return 'Big';
    return size;
  };

  // Helper function to clean and normalize CSV values
  const normalizeValue = (value) => {
    if (typeof value !== 'string') return '';
    return value.toLowerCase().trim();
  };

  // Helper function to check if value matches any option in a list
  const isMatch = (value, optionsStr) => {
    if (!optionsStr) return false;
    const normalizedValue = normalizeValue(value);
    const options = normalizeValue(optionsStr)
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    
    return options.includes(normalizedValue) || options.includes('any');
  };

  // Calculate matching hairstyles based on user selections
  const calculateResults = (selections) => {
    // Log user selections if debug mode is on
    if (DEBUG) {
      console.log('\n=== User Selections ===');
      console.table({
        'Face Shape': selections.faceShape,
        'Hair Type': selections.hairType,
        'Hair Density': selections.hairDensity,
        'Forehead Size': selections.foreheadSize,
        'Receding Hairline': selections.recedingHairline,
        'Skin Color': selections.skinColor,
        'Region': selections.continent,
        'Age Range': selections.ageRange
      });
      console.log('=====================\n');
    }

    const matches = hairstyles.map(hairstyle => {
      let score = 0;
      let totalWeight = 0;
      let featureMatches = {};
      
      // Face shape
      const faceShapeMatch = isMatch(selections.faceShape, hairstyle['Face Shape (30)']);
      if (faceShapeMatch) score += steps[0].weight;
      totalWeight += steps[0].weight;
      featureMatches['Face Shape'] = faceShapeMatch;
      
      // Hair type
      const hairTypeMatch = isMatch(selections.hairType, hairstyle['Hair Type (20)']);
      if (hairTypeMatch) score += steps[1].weight;
      totalWeight += steps[1].weight;
      featureMatches['Hair Type'] = hairTypeMatch;
      
      // Hair density
      const densityMatch = isMatch(selections.hairDensity, hairstyle['Hair Density (15)']);
      if (densityMatch) score += steps[2].weight;
      totalWeight += steps[2].weight;
      featureMatches['Hair Density'] = densityMatch;
      
      // Forehead size
      const normalizedSelection = normalizeForeheadSize(selections.foreheadSize);
      const foreheadMatch = isMatch(normalizedSelection, hairstyle['Forehead Size (10)']);
      if (foreheadMatch) score += steps[3].weight;
      totalWeight += steps[3].weight;
      featureMatches['Forehead Size'] = foreheadMatch;
      
      // Receding hairline
      const hairlineMatch = isMatch(selections.recedingHairline, hairstyle['Receding Hairline (10)']);
      if (hairlineMatch) score += steps[4].weight;
      totalWeight += steps[4].weight;
      featureMatches['Receding Hairline'] = hairlineMatch;
      
      // Skin color
      const skinMatch = isMatch(selections.skinColor, hairstyle['Skin Color (5)']);
      if (skinMatch) score += steps[5].weight;
      totalWeight += steps[5].weight;
      featureMatches['Skin Color'] = skinMatch;
      
      // Continent
      const continentMatch = isMatch(selections.continent, hairstyle['Continent (5)']);
      if (continentMatch) score += steps[6].weight;
      totalWeight += steps[6].weight;
      featureMatches['Region'] = continentMatch;
      
      // Age range
      const ageRangeOptions = String(hairstyle['Age Range (5)']).toLowerCase().trim();
      const ageMatch = isAgeInRange(selections.ageRange, ageRangeOptions);
      if (ageMatch) score += steps[7].weight;
      totalWeight += steps[7].weight;
      featureMatches['Age Range'] = ageMatch;
      
      // Calculate percentage match
      const percentMatch = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
      
      return {
        name: hairstyle['Hairstyle Name'],
        score: percentMatch,
        matches: featureMatches
      };
    });
    
    // Filter matches to show only those above 80%, sort by score, and take top 10
    const sortedMatches = matches
      .filter(match => match.score >= 80)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);  // Limit to top 10 results

    // Log matching hairstyles with their details from CSV if debug mode is on
    if (DEBUG) {
      console.log('\n=== Matching Hairstyles ===');
      sortedMatches.forEach((match, index) => {
        const hairstyle = hairstyles.find(h => h['Hairstyle Name'] === match.name);
        console.log(`\n${index + 1}. ${match.name} (${match.score}% Match)`);
        console.table({
          'Face Shape': hairstyle['Face Shape (30)'],
          'Hair Type': hairstyle['Hair Type (20)'],
          'Hair Density': hairstyle['Hair Density (15)'],
          'Forehead Size': hairstyle['Forehead Size (10)'],
          'Receding Hairline': hairstyle['Receding Hairline (10)'],
          'Skin Color': hairstyle['Skin Color (5)'],
          'Region': hairstyle['Continent (5)'],
          'Age Range': hairstyle['Age Range (5)']
        });
      });
      console.log('=====================\n');
    }
      
    setResults(sortedMatches);
  };

  // Calculate the progress percentage
  const progressPercentage = ((currentStep) / steps.length) * 100;

  // Toggle details visibility for results
  const toggleDetails = (index) => {
    setExpandedCards(prev => {
      const newExpanded = [...prev];
      newExpanded[index] = !newExpanded[index];
      return newExpanded;
    });
  };

  // Render the current step content
  const renderStepContent = () => {
    // If we've gone through all steps, show results
    if (currentStep === steps.length) {
      return (
        <div className="results-container">
          <h2>Your Perfect Style Matches</h2>
          <div className="results-grid">
            {results.map((result, index) => renderResults(result, index))}
          </div>
          <button className="back-button" onClick={() => setCurrentStep(0)}>Start Over</button>
        </div>
      );
    }
    
    const currentStepData = steps[currentStep];
    const isAgeRangeStep = currentStepData.key === 'ageRange';

    return (
      <div className={`step-content ${isAgeRangeStep ? 'age-range-step' : ''}`}>
        <h2>{currentStepData.name}</h2>
        <p>Select your {currentStepData.name.toLowerCase()}:</p>
        
        <div className="content-wrapper">
          <div className="options-grid">
            {currentStepData.options.map((option, index) => (
              <div
                key={index}
                className="option-card"
                onClick={() => handleOptionSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
          
          <div className="button-container">
            {currentStep > 0 && (
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render individual result with expandable details
  const renderResults = (result, index) => (
    <div key={index} className="result-card" data-expanded={expandedCards[index]}>
      <div className="result-header" onClick={() => toggleDetails(index)}>
        <div className="result-main">
          <h3>{result.name}</h3>
          <div className="match-percentage">
            <div className="match-bar">
              <div className="match-fill" style={{ width: `${result.score}%` }}></div>
            </div>
            <span>{result.score}% Match</span>
          </div>
        </div>
        <button className="expand-button" aria-label="Toggle details">
          <svg className="expand-icon" viewBox="0 0 24 24" width="24" height="24">
            <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="result-details">
        <div className="match-features">
          <h4>Matching Features</h4>
          <ul>
            {Object.entries(result.matches || {}).map(([feature, matched]) => (
              matched && (
                <li key={feature} className="feature-match">
                  <svg viewBox="0 0 24 24" width="16" height="16" className="check-icon">
                    <path d="M20 6L9 17l-5-5" fill="none" stroke="#6b46c1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {feature}
                </li>
              )
            ))}
          </ul>
        </div>
        <div className="mismatch-features">
          <h4>Different Features</h4>
          <ul>
            {Object.entries(result.matches || {}).map(([feature, matched]) => (
              !matched && (
                <li key={feature} className="feature-mismatch">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="#e53e3e" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  {feature}
                </li>
              )
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>YourHairstyle</h1>
        <p>Find your perfect hairstyle in seconds</p>
      </header>
      
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
      </div>
      
      <div className="steps-indicator">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`step-dot ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
          ></div>
        ))}
      </div>
      
      {renderStepContent()}
    </div>
  )
}

export default App
