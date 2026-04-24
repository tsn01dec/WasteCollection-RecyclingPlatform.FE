import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Globe, 
  LogOut, 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  UserCircle2,
  ShieldCheck,
  Building2,
  Users,
  HardHat,
  Venus,
  Mars,
  Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../lib/auth';
import { updateProfile } from '../api/userApi';
import { motion } from 'framer-motion';
import AlertModal from '../components/ui/AlertModal';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({});
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = React.useRef(null);
  
  // Role categorisation: 3, 4 are Simple UI. 1, 2 are Detailed UI.
  const isSimpleUI = user ? (user.role === 'Administrator' || user.role === '3' || 
                     user.role === 'RecyclingEnterprise' || user.role === '4') : false;

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(getUser());
    };
    window.addEventListener('ecosort_auth_changed', handleAuthChange);
    return () => window.removeEventListener('ecosort_auth_changed', handleAuthChange);
  }, []);
  
  const onLogout = () => {
    clearAuth();
    navigate('/', { replace: true });
  };

  const handleEditInit = () => {
    setFormData({
      fullName: user.fullName || '',
      displayName: user.displayName || user.name || '',
      gender: user.gender || 'Male',
      dob: user.dob || (user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '1990-01-01'),
      phone: user.phone || user.phoneNumber || '',
      email: user.email || user.gmail || '',
      address: user.address || 'Hồ Chí Minh, Việt Nam',
      language: user.language || 'Tiếng Việt'
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Validation: Phone must be 10 digits numeric if provided
    const phoneRegex = /^[0-9]{10}$/;
    if (!isSimpleUI && formData.phone && formData.phone.trim() !== '') {
      if (!phoneRegex.test(formData.phone.trim())) {
        setAlertConfig({
          isOpen: true,
          title: "Định dạng không hợp lệ",
          message: "Số điện thoại phải bao gồm đúng 10 chữ số và không chứa ký tự đặc biệt.",
          type: "error"
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      // Map FE field names to BE field names
      const requestData = {
        DisplayName: formData.displayName,
        FullName: formData.fullName,
        Gender: formData.gender,
        DateOfBirth: formData.dob,
        PhoneNumber: formData.phone,
        Address: formData.address,
        Language: formData.language,
        AvatarUrl: user.avatar || user.avatarUrl,
        AvatarFile: avatarFile
      };

      const updatedUser = await updateProfile(requestData);
      
      // Update local state
      setUser(updatedUser);
      // Update global storage for other components (Header)
      localStorage.setItem('ecosort_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('ecosort_auth_changed'));
      
      setAlertConfig({
        isOpen: true,
        title: "Thành công",
        message: "Hồ sơ của bạn đã được cập nhật thành công.",
        type: "success"
      });
      setIsEditing(false);
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    } catch (err) {
      console.error("Profile update error:", err);
      setAlertConfig({
        isOpen: true,
        title: "Lỗi cập nhật",
        message: err.message || "Đã có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.",
        type: "error"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center text-on-surface-variant">
          <User className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-on-surface mb-2">Chưa đăng nhập</h2>
          <p className="text-on-surface-variant">Vui lòng đăng nhập để xem thông tin hồ sơ của bạn.</p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all active:scale-95 shadow-xl shadow-primary/20"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  const roleInfo = {
    'Administrator': { label: 'Quản trị viên', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
    '3': { label: 'Quản trị viên', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50' },
    'RecyclingEnterprise': { label: 'Doanh nghiệp', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
    '4': { label: 'Doanh nghiệp', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
    'Collector': { label: 'Nhân viên thu gom', icon: HardHat, color: 'text-amber-600 bg-amber-50' },
    '2': { label: 'Nhân viên thu gom', icon: HardHat, color: 'text-amber-600 bg-amber-50' },
    'Citizen': { label: 'Người dân', icon: Users, color: 'text-primary-dark bg-primary-light/10' },
    '1': { label: 'Người dân', icon: Users, color: 'text-primary-dark bg-primary-light/10' }
  };

  const currentRole = roleInfo[user.role] || { label: 'Thành viên', icon: User, color: 'text-on-surface-variant bg-surface-container' };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold"
        >
          <div className="p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          Quay lại
        </button>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-error hover:bg-error/10 px-4 py-2 rounded-xl transition-all font-bold group"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Đăng xuất
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Avatar & Basic Info Card */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="eco-glass bg-surface rounded-[3rem] p-8 border border-surface-container-high botanical-shadow-lg text-center space-y-6"
          >
            <div className="relative inline-block">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleAvatarChange} 
                 className="hidden" 
                 accept="image/*"
               />
               <div 
                 className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden mx-auto bg-surface-container-low ring-1 ring-surface-container-highest transition-all ${isEditing ? 'cursor-pointer ring-primary ring-offset-2 hover:scale-105 active:scale-95 group' : ''}`}
                 onClick={() => isEditing && fileInputRef.current?.click()}
               >
                  <img 
                    src={avatarPreview || ((user?.avatarUrl || user?.AvatarUrl || user?.avatar) ? `${user?.avatarUrl || user?.AvatarUrl || user?.avatar}${ (user?.avatarUrl || user?.AvatarUrl || user?.avatar).includes('?') ? '&' : '?' }t=${new Date().getTime()}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`)} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-8 h-8 text-white" />
                    </div>
                  )}
               </div>
               <div className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-xl">
                  <UserCircle2 className="w-6 h-6" />
               </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tighter">
                  {isEditing ? (formData.displayName || formData.fullName) : (user.displayName || user.name)}
                </h1>
                {((isEditing ? formData.phone : (user.phone || user.phoneNumber)) || isSimpleUI) && (
                  <img src="/verify/verified.png" alt="verified" className="w-6 h-6 object-contain shrink-0 animate-in zoom-in duration-300" />
                )}
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${currentRole.color} text-xs font-black uppercase tracking-widest`}>
                 <currentRole.icon className="w-3.5 h-3.5" />
                 {currentRole.label}
              </div>
            </div>

            <div className="pt-6 border-t border-surface-container-high border-dashed space-y-4">
               <div className="flex items-center gap-3 text-on-surface-variant/70 text-sm font-medium">
                  <Mail className="w-4 h-4 text-primary/60" />
                  <span className="truncate">{isEditing ? formData.email : (user.email || user.gmail)}</span>
               </div>
               <div className="flex items-center gap-3 text-on-surface-variant/70 text-sm font-medium">
                  <Globe className="w-4 h-4 text-primary/60" />
                  <span>{isEditing ? formData.language : (user.language || 'Tiếng Việt')}</span>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Detailed Info Sections */}
        <div className="lg:col-span-8">
          <div className="eco-glass bg-surface rounded-[3rem] p-8 md:p-12 border border-surface-container-high botanical-shadow-lg space-y-10">
            
            {/* Header with Title and Edit Button */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
               <div className="space-y-2">
                  <h2 className="text-3xl font-black text-on-surface tracking-tighter">
                    {isSimpleUI ? 'Hồ sơ quản trị' : 'Thông tin cá nhân'}
                  </h2>
                  <p className="text-on-surface-variant font-medium">
                    {isSimpleUI 
                      ? 'Thông tin xác thực dành cho quản quản lý hệ thống.'
                      : 'Chi tiết hồ sơ giúp chúng tôi hỗ trợ và liên hệ với bạn tốt hơn.'}
                  </p>
               </div>
               {!isEditing ? (
                 <button 
                   onClick={handleEditInit}
                   className="flex items-center gap-2 bg-surface-container text-on-surface px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-inner shrink-0"
                 >
                   <Edit2 className="w-3.5 h-3.5" />
                   {isSimpleUI ? 'Chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                 </button>
               ) : (
                 <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-on-surface-variant hover:bg-[#ffffff] transition-all"
                    >
                      Hủy
                    </button>
                   <button 
                     onClick={handleSave}
                     disabled={isSaving}
                     className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                   >
                     {isSaving ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                     )}
                     Lưu thay đổi
                   </button>
                 </div>
               )}
            </div>

            <div className="space-y-8">
               {isSimpleUI ? (
                 /* Template A: Simplified (Admin/Enterprise) */
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <InfoField 
                      isEditing={isEditing}
                      icon={User} 
                      label="Tên quản trị" 
                      value={isEditing ? formData.displayName : user.displayName || user.name}
                      onChange={(val) => handleInputChange('displayName', val)}
                    />
                    <InfoField 
                      isEditing={isEditing}
                      icon={Mail} 
                      label="Địa chỉ Gmail" 
                      value={isEditing ? formData.email : user.email || user.gmail}
                      onChange={(val) => handleInputChange('email', val)}
                    />
                    <InfoField 
                      isEditing={isEditing}
                      icon={Globe} 
                      label="Ngôn ngữ hệ thống" 
                      value={isEditing ? formData.language : user.language || 'Tiếng Việt'}
                      type="select"
                      options={['Tiếng Việt', 'English']}
                      onChange={(val) => handleInputChange('language', val)}
                    />
                    <InfoField 
                      isEditing={false} // Status always read-only
                      icon={ShieldCheck} 
                      label="Trạng thái" 
                      value="Đã xác thực" 
                    />
                 </div>
               ) : (
                 /* Template B: Detailed (Collector/Citizen) */
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InfoField 
                         isEditing={isEditing}
                         icon={User} 
                         label="Họ tên đầy đủ" 
                         value={isEditing ? formData.fullName : user.fullName || 'Chưa cập nhật'} 
                         onChange={(val) => handleInputChange('fullName', val)}
                       />
                       <InfoField 
                         isEditing={isEditing}
                         icon={UserCircle2} 
                         label="Tên hiển thị" 
                         value={isEditing ? formData.displayName : user.displayName || user.name} 
                         onChange={(val) => handleInputChange('displayName', val)}
                       />
                       <InfoField 
                         isEditing={isEditing}
                         icon={formData.gender === 'Female' ? Venus : Mars} 
                         label="Giới tính" 
                         value={isEditing ? formData.gender : user.gender === 'Female' ? 'Nữ' : 'Nam'}
                         type="select"
                         options={[{label: 'Nam', value: 'Male'}, {label: 'Nữ', value: 'Female'}]}
                         onChange={(val) => handleInputChange('gender', val)}
                       />
                       <InfoField 
                         isEditing={isEditing}
                         icon={Calendar} 
                         label="Ngày sinh" 
                         value={isEditing ? formData.dob : (user.dob || user.dateOfBirth || '1990-01-01')} 
                         type="date"
                         onChange={(val) => handleInputChange('dob', val)}
                       />
                       <InfoField 
                         isEditing={isEditing}
                         icon={Phone} 
                         label="Số điện thoại" 
                         value={isEditing ? formData.phone : (user.phone || user.phoneNumber || 'Chưa cập nhật')} 
                         onChange={(val) => handleInputChange('phone', val)}
                       />
                       <InfoField 
                         isEditing={isEditing}
                         icon={Mail} 
                         label="Địa chỉ Gmail" 
                         value={isEditing ? formData.email : user.email || user.gmail} 
                         onChange={(val) => handleInputChange('email', val)}
                       />
                       <InfoField 
                         isEditing={isEditing}
                         icon={Globe} 
                         label="Ngôn ngữ chính" 
                         value={isEditing ? formData.language : user.language || 'Tiếng Việt'}
                         type="select"
                         options={['Tiếng Việt', 'English']}
                         onChange={(val) => handleInputChange('language', val)}
                       />
                    </div>
                    
                    <div className="pt-6 border-t border-surface-container-high border-dashed">
                       <InfoField 
                         isEditing={isEditing}
                         icon={MapPin} 
                         label="Địa chỉ thường trú" 
                         value={isEditing ? formData.address : user.address || 'Hồ Chí Minh, Việt Nam'} 
                         fullWidth 
                         onChange={(val) => handleInputChange('address', val)}
                       />
                    </div>
                 </div>
               )}
            </div>
            
            <div className="pt-8 border-t border-surface-container-high">
               <p className="text-xs font-medium text-on-surface-variant/40 italic">Cập nhật lần cuối: Vừa xong</p>
            </div>
          </div>
        </div>
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function InfoField({ isEditing, icon: Icon, label, value, onChange, type = 'text', options = [], fullWidth = false, required = false }) {
  return (
    <div className={`space-y-2 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 opacity-40">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </span>
      </div>
      
      {isEditing ? (
        type === 'select' ? (
          <select 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-4 bg-surface rounded-2xl border-2 border-primary/20 font-bold text-on-surface focus:border-primary outline-none transition-all shadow-inner appearance-none cursor-pointer"
          >
            {options.map(opt => (
              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                {typeof opt === 'string' ? opt : opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input 
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-4 bg-surface rounded-2xl border-2 border-primary/20 font-bold text-on-surface focus:border-primary outline-none transition-all shadow-inner"
          />
        )
      ) : (
        <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-surface-container-high font-bold text-on-surface shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-3">
            {type === 'date' && value ? new Date(value).toLocaleDateString('vi-VN') : value}
          </div>
        </div>
      )}
    </div>
  );
}
