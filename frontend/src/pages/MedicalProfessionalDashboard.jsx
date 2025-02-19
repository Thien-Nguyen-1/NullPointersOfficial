import { Link } from "react-router-dom";

function MedicalProfessionalDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Medical Professional Dashboard</h1>
      <div className="mt-4 space-y-4">
        <Link to="/messaging" className="block py-2 px-4 bg-green-500 text-white rounded">Messaging</Link>
        <Link to="/settings" className="block py-2 px-4 bg-green-500 text-white rounded">Settings</Link>
        <Link to="/records" className="block py-2 px-4 bg-green-500 text-white rounded">Patients' Records</Link>
      </div>
    </div>
  );
}

export default MedicalProfessionalDashboard;
