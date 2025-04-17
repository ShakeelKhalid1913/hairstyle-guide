import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import './App.css'

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
      options: ['Small', 'Medium', 'Big']
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
      options: ['Teens-30s', '18-35', '18-40', '18-45', '18-50', '20-40', '20-45', '20-50', 'Any']
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

  // Calculate matching hairstyles based on user selections
  const calculateResults = (selections) => {
    const matches = hairstyles.map(hairstyle => {
      let score = 0;
      let totalWeight = 0;
      
      // Check face shape
      const faceShapeOptions = String(hairstyle['Face Shape (30)']).toLowerCase().split(',').map(s => s.trim());
      if (faceShapeOptions.includes(selections.faceShape.toLowerCase()) || faceShapeOptions.includes('any')) {
        score += steps[0].weight;
      }
      totalWeight += steps[0].weight;
      
      // Check hair type
      const hairTypeOptions = String(hairstyle['Hair Type (20)']).toLowerCase().split(',').map(s => s.trim());
      if (hairTypeOptions.includes(selections.hairType.toLowerCase()) || hairTypeOptions.includes('any')) {
        score += steps[1].weight;
      }
      totalWeight += steps[1].weight;
      
      // Check hair density
      const hairDensityOptions = String(hairstyle['Hair Density (15)']).toLowerCase().split(',').map(s => s.trim());
      if (hairDensityOptions.includes(selections.hairDensity.toLowerCase()) || hairDensityOptions.includes('any')) {
        score += steps[2].weight;
      }
      totalWeight += steps[2].weight;
      
      // Check forehead size
      const foreheadSizeOptions = String(hairstyle['Forehead Size (10)']).toLowerCase().split(',').map(s => s.trim());
      if (foreheadSizeOptions.includes(selections.foreheadSize.toLowerCase()) || foreheadSizeOptions.includes('any')) {
        score += steps[3].weight;
      }
      totalWeight += steps[3].weight;
      
      // Check receding hairline
      const recedingHairlineOptions = String(hairstyle['Receding Hairline (10)']).toLowerCase().split(',').map(s => s.trim());
      if (recedingHairlineOptions.includes(selections.recedingHairline.toLowerCase()) || recedingHairlineOptions.includes('any')) {
        score += steps[4].weight;
      }
      totalWeight += steps[4].weight;
      
      // Check skin color
      const skinColorOptions = String(hairstyle['Skin Color (5)']).toLowerCase().split(',').map(s => s.trim());
      if (skinColorOptions.includes(selections.skinColor.toLowerCase()) || skinColorOptions.includes('any')) {
        score += steps[5].weight;
      }
      totalWeight += steps[5].weight;
      
      // Check continent
      const continentOptions = String(hairstyle['Continent (5)']).toLowerCase().split(',').map(s => s.trim());
      if (continentOptions.includes(selections.continent.toLowerCase()) || continentOptions.includes('any')) {
        score += steps[6].weight;
      }
      totalWeight += steps[6].weight;
      
      // Check age range
      const ageRangeOptions = String(hairstyle['Age Range (5)']).toLowerCase().split(',').map(s => s.trim());
      if (ageRangeOptions.includes(selections.ageRange.toLowerCase()) || ageRangeOptions.includes('any')) {
        score += steps[7].weight;
      }
      totalWeight += steps[7].weight;
      
      // Calculate percentage match
      const percentMatch = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
      
      return {
        name: hairstyle['Hairstyle Name'],
        score: percentMatch
      };
    });
    
    // Sort by score and take the top 5
    const sortedMatches = matches.sort((a, b) => b.score - a.score).slice(0, 5);
    setResults(sortedMatches);
  };

  // Calculate the progress percentage
  const progressPercentage = ((currentStep) / steps.length) * 100;

  // Render the current step content
  const renderStepContent = () => {
    // If we've gone through all steps, show results
    if (currentStep === steps.length) {
      return (
        <div className="results-container">
          <h2>Your Perfect Style Matches</h2>
          <div className="results-grid">
            {results.map((result, index) => (
              <div key={index} className="result-card">
                <h3>{result.name}</h3>
                <div className="match-percentage">
                  <div className="match-bar">
                    <div className="match-fill" style={{ width: `${result.score}%` }}></div>
                  </div>
                  <span>{result.score}% Match</span>
                </div>
              </div>
            ))}
          </div>
          <button className="back-button" onClick={() => setCurrentStep(0)}>Start Over</button>
        </div>
      );
    }
    
    const currentStepData = steps[currentStep];
    return (
      <div className="step-content">
        <h2>{currentStepData.name}</h2>
        <p>Select your {currentStepData.name.toLowerCase()}:</p>
        
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
        
        {currentStep > 0 && (
          <button className="back-button" onClick={handleBack}>
            Back
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>StyleMatch</h1>
        <p>Discover your signature look in seconds</p>
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
