import React, { useState } from 'react';

function ImageUploader() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);

            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    return (
        <div>
            <input type='file' accept='image/*' onChange={handleImageChange} />
            {previewUrl && <img src={previewUrl} alt='Preview' />}
        </div>
    )
}

function Construct() {
    const [formData, setFormData] = useState({
        colorDetails: '',
        extraColor: '',
        image: null
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }
    
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData)
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <fieldset className="fieldBorder pad w-[90%] mx-auto">
                    <legend className="cntr">
                        Construct Furniture
                    </legend>
                    <label>
                        Select Furniture:
                    </label>
                    <select name='furnitureType' id='furnitureType' className="pad">
                        <option value="">Select Furniture</option>
                        <option value="chair">Chair</option>
                        <option value="table">Table</option>
                        <option value="desk">Desk</option>
                        <option value="bed">Bed</option>
                        <option value="sofa">Sofa</option>
                    </select>
                    <br />
                    <div>
                        <label>
                            Primary Finish:
                        </label>
                        <input type='text' name='primFinish' id='primFinish' className='colorTextBox' />
                        <br />
                        <label className='mt-1'>
                            Secondary Finish:
                        </label>
                        <input type='text' name='secFinish' id='secFinish' className='colorTextBox' />
                        <br />
                        <label className='mt-1 mr-1'>
                            Extra Finish:
                        </label>
                        <label className='mr-1'>
                            <input type='radio' name='extraFinish' id='extraFinish' value='Yes' onChange={handleChange} className='colorRadio' />
                            Yes
                        </label>
                        <label className='mr-1'>
                            <input type='radio' name='extraColor' id='extraColor' value='No'onChange={handleChange} className='colorRadio' />
                            No
                        </label>
                        {formData.extraColor === 'Yes' && (
                            <textarea name='extraColor' id='extraColor' className='colorTextArea' placeholder='Color Details: Comma separated (Red, Green, Blue, ...)' />
                        )}
                        <br />
                        <label>
                            Special Finishes:
                        </label>
                        <input type='checkbox' name='specialFinishes' id='specialFinishes' className='ml-1 mr-1' onChange={handleChange} />
                        <label htmlFor='specialFinishes'>Cushioning</label>
                        <input type='checkbox' name='specialFinishes' id='specialFinishes' className='ml-1 mr-1' onChange={handleChange} />
                        <label htmlFor='specialFinishes'>Stitching Color</label>
                        <br />
                        <label>
                            Schema Image:
                        </label>
                        <ImageUploader />
                        <br />
                        <button type='submit'>Submit</button>
                    </div>    
                </fieldset>
            </form>
        </>
    )
}

export default Construct;