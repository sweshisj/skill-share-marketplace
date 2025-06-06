// frontend/src/app/(auth)/signup/page.tsx
'use client'; // This directive marks the component as a Client Component

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { CreateUserRequest, UserType } from '../../../types';

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('individual');
  const [formData, setFormData] = useState<CreateUserRequest>({
    userType: 'individual',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    mobileNumber: '',
    companyName: '',
    phoneNumber: '',
    businessTaxNumber: '', // Example: "ABC1234567"
    representativeFirstName: '',
    representativeLastName: '',
    address: {
        streetNumber: '', streetName: '', citySuburb: '', state: '', postCode: ''
    }
  });
  const [error, setError] = useState('');
  const { signup, loading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Handle nested address fields
    if (name.startsWith('address.')) {
        const addressField = name.split('.')[1] as keyof typeof formData.address;
        setFormData(prev => ({
            ...prev,
            address: {
                ...(prev.address || {}), // Ensure address object exists
                [addressField]: value
            }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUserTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUserType = e.target.value as UserType;
    setUserType(newUserType);
    setFormData(prev => ({
        ...prev,
        userType: newUserType,
        // Reset fields that are not applicable to the new type to avoid sending empty strings for optional fields
        firstName: newUserType === 'individual' ? prev.firstName : '',
        lastName: newUserType === 'individual' ? prev.lastName : '',
        mobileNumber: newUserType === 'individual' ? prev.mobileNumber : '', // Mobile is optional for both, but for clarity
        companyName: newUserType === 'company' ? prev.companyName : '',
        phoneNumber: newUserType === 'company' ? prev.phoneNumber : '',
        businessTaxNumber: newUserType === 'company' ? prev.businessTaxNumber : '',
        representativeFirstName: newUserType === 'company' ? prev.representativeFirstName : '',
        representativeLastName: newUserType === 'company' ? prev.representativeLastName : '',
        // Address is mandatory for individual, optional for company. Reset it if switching from company to individual.
        address: newUserType === 'individual' ? prev.address || {streetNumber: '', streetName: '', citySuburb: '', state: '', postCode: ''} : {} // Use empty object if company
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // Basic client-side validation
    if (!formData.email || !formData.password || formData.password.length < 8) {
        setError('Email and password (minimum 8 characters) are required.');
        return;
    }

    // Deep copy formData to send, omitting empty optional fields for better backend handling
    const dataToSend: CreateUserRequest = { ...formData };

    // Clean up address if it's empty for company or any individual fields are empty
    if (userType === 'company' && Object.values(dataToSend.address || {}).every(val => !val)) {
        delete dataToSend.address;
    }
    if (userType === 'individual' && dataToSend.address) {
        Object.keys(dataToSend.address).forEach(key => {
            if (!(dataToSend.address as any)[key]) {
                delete (dataToSend.address as any)[key]; // Remove individual empty address fields
            }
        });
    }

    if (userType === 'individual') {
        if (!dataToSend.firstName || !dataToSend.lastName || !dataToSend.address?.streetName || !dataToSend.address.citySuburb || !dataToSend.address.state || !dataToSend.address.postCode) {
            setError('For individual signup, First Name, Last Name, and a complete Address are mandatory.');
            return;
        }
        // Ensure company-specific fields are not sent
        delete (dataToSend as any).companyName;
        delete (dataToSend as any).phoneNumber;
        delete (dataToSend as any).businessTaxNumber;
        delete (dataToSend as any).representativeFirstName;
        delete (dataToSend as any).representativeLastName;
    } else { // company
        if (!dataToSend.companyName || !dataToSend.businessTaxNumber || !dataToSend.representativeFirstName || !dataToSend.representativeLastName) {
            setError('For company signup, Company Name, Business Tax Number, and Representative Full Name are mandatory.');
            return;
        }
        if (!dataToSend.businessTaxNumber.match(/^[A-Z0-9]{10}$/)) {
            setError('Business Tax Number must be 10 capital letters and digits (A-Z, 0-9).');
            return;
        }
        // Ensure individual-specific fields are not sent
        delete (dataToSend as any).firstName;
        delete (dataToSend as any).lastName;
    }

    try {
      await signup(dataToSend); // Send the prepared data
      // Redirection handled by AuthContext
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Create Your SkillShare Account</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userType" className="block text-gray-700 text-sm font-bold mb-2">Account Type:</label>
            <select
              id="userType"
              name="userType"
              className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={userType}
              onChange={handleUserTypeChange}
              aria-label="Account Type"
            >
              <option value="individual">Individual (User or Provider)</option>
              <option value="company">Company (User or Provider)</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.email}
              onChange={handleChange}
              required
              aria-label="Email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password (min 8 chars):</label>
            <input
              type="password"
              id="password"
              name="password"
              className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
              aria-label="Password"
            />
          </div>
          <div>
            <label htmlFor="mobileNumber" className="block text-gray-700 text-sm font-bold mb-2">Mobile Number (Optional):</label>
            <input
              type="text"
              id="mobileNumber"
              name="mobileNumber"
              className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.mobileNumber}
              onChange={handleChange}
              aria-label="Mobile Number"
            />
          </div>

          {userType === 'individual' ? (
            <>
              <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800">Individual Details</h2>
              <div>
                <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">First Name:</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-gray-700 text-sm font-bold mb-2">Last Name:</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800">Address (Mandatory for Individual)</h3>
              <div>
                <label htmlFor="address.streetNumber" className="block text-gray-700 text-sm font-bold mb-2">Street Number:</label>
                <input type="text" id="address.streetNumber" name="address.streetNumber" value={formData.address?.streetNumber || ''} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.streetName" className="block text-gray-700 text-sm font-bold mb-2">Street Name:</label>
                <input type="text" id="address.streetName" name="address.streetName" value={formData.address?.streetName || ''} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.citySuburb" className="block text-gray-700 text-sm font-bold mb-2">City/Suburb:</label>
                <input type="text" id="address.citySuburb" name="address.citySuburb" value={formData.address?.citySuburb || ''} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.state" className="block text-gray-700 text-sm font-bold mb-2">State:</label>
                <input type="text" id="address.state" name="address.state" value={formData.address?.state || ''} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.postCode" className="block text-gray-700 text-sm font-bold mb-2">Post Code:</label>
                <input type="text" id="address.postCode" name="address.postCode" value={formData.address?.postCode || ''} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </>
          ) : ( // Company fields
            <>
              <h2 className="text-xl font-semibold mt-6 mb-2 text-gray-800">Company Details</h2>
              <div>
                <label htmlFor="companyName" className="block text-gray-700 text-sm font-bold mb-2">Company Name:</label>
                <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">Company Phone Number (Optional):</label>
                <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="businessTaxNumber" className="block text-gray-700 text-sm font-bold mb-2">Business Tax Number (10 alphanumeric, e.g., ABC1234567):</label>
                <input type="text" id="businessTaxNumber" name="businessTaxNumber" value={formData.businessTaxNumber} onChange={handleChange} maxLength={10} pattern="[A-Z0-9]{10}" title="10 capital letters and digits (0-9)" required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="representativeFirstName" className="block text-gray-700 text-sm font-bold mb-2">Representative First Name:</label>
                <input type="text" id="representativeFirstName" name="representativeFirstName" value={formData.representativeFirstName} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="representativeLastName" className="block text-gray-700 text-sm font-bold mb-2">Representative Last Name:</label>
                <input type="text" id="representativeLastName" name="representativeLastName" value={formData.representativeLastName} onChange={handleChange} required className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800">Address (Optional for Company)</h3>
              <div>
                <label htmlFor="address.streetNumber" className="block text-gray-700 text-sm font-bold mb-2">Street Number:</label>
                <input type="text" id="address.streetNumber" name="address.streetNumber" value={formData.address?.streetNumber || ''} onChange={handleChange} className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.streetName" className="block text-gray-700 text-sm font-bold mb-2">Street Name:</label>
                <input type="text" id="address.streetName" name="address.streetName" value={formData.address?.streetName || ''} onChange={handleChange} className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.citySuburb" className="block text-gray-700 text-sm font-bold mb-2">City/Suburb:</label>
                <input type="text" id="address.citySuburb" name="address.citySuburb" value={formData.address?.citySuburb || ''} onChange={handleChange} className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.state" className="block text-gray-700 text-sm font-bold mb-2">State:</label>
                <input type="text" id="address.state" name="address.state" value={formData.address?.state || ''} onChange={handleChange} className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="address.postCode" className="block text-gray-700 text-sm font-bold mb-2">Post Code:</label>
                <input type="text" id="address.postCode" name="address.postCode" value={formData.address?.postCode || ''} onChange={handleChange} className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
            </>
          )}

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md w-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">Login Here</Link>
        </p>
      </div>
    </div>
  );
}