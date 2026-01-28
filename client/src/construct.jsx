import React, { useState } from 'react';

function Construct() {
    const [formData, setFormData] = useState({
        furnitureType: '',
        colorDetails: '',
        otherColor: '',
        extraColor: ''
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    return (
        <>
            <form>
                <fieldset className="fieldBorder pad w-[90%] mx-auto">
                    <legend className="cntr">
                        Construct Furniture
                    </legend>
                    <label>
                        Select Furniture:
                    </label>
                    <select name='furnitureType' id='furnitureType' className="pad" onChange={handleChange}>
                        <option value="">Select Furniture</option>
                        <option value="chair">Chair</option>
                        <option value="table">Table</option>
                        <option value="desk">Desk</option>
                        <option value="bed">Bed</option>
                        <option value="sofa">Sofa</option>
                    </select>
                    <br></br>
                    
                    {formData.furnitureType && (
                        <div>
                            <label>
                                Primary Color:
                            </label>
                            <select name='primColor' id='primColor' onChange={handleChange}>Select Primary Color
                                <option value="">Select Primary Color</option>
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="yellow">Yellow</option>
                                <option value="black">Black</option>
                                <option value="white">White</option>
                                <option value="other">Other (Please specify)</option>
                            </select>
                            {formData.primColor ==='other' && (
                                <input type='text' name='primColor' id='primColor' className='colorTextBox' />
                            )}
                            <br></br>
                            <label className='mt-1'>
                                Secondary Color:
                            </label>
                            <select name='secColor' id='secColor' onChange={handleChange}>Select Secondary Color
                                <option value="">Select Secondary Color</option>
                                <option value="red">Red</option>
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="yellow">Yellow</option>
                                <option value="black">Black</option>
                                <option value="white">White</option>
                                <option value="other">Other (Please specify)</option>
                            </select>
                            {formData.secColor ==='other' && (
                                <input type='text' name='secColor' id='secColor' className='colorTextBox' />
                            )}
                            <br></br>
                            <label className='mt-1 mr-1'>
                                Extra Color:
                            </label>
                            <label>
                                <input type='radio' name='extraColor' id='extraColor' value='Yes' onChange={handleChange} className='colorRadio' />
                                Yes
                            </label>
                            <label>
                                <input type='radio' name='extraColor' id='extraColor' value='No'onChange={handleChange} className='colorRadio' />
                                No
                            </label>
                            {formData.extraColor === 'Yes' && (
                                <textarea name='extraColor' id='extraColor' className='colorTextArea' placeholder='Comma separated (Red, Green, Blue, ...)' />
                            )}
                            
                        </div>
                    )}
                </fieldset>
            </form>
        </>
    )
}

export default Construct;