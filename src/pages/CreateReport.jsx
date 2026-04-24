import { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    FileText,
    Loader2,
    MapPin,
    PlusCircle,
    Star,
    Tag,
    Type,
} from 'lucide-react';
import { getUser } from '../lib/auth';
import { createWasteReport, getWasteReportCategories } from '../api/WasteReportapi';
import { getCapacity } from '../api/areaApi';

const MAX_REPORT_TOTAL_KG = 10;
const MAX_REPORT_IMAGES = 3;

function getReportLineItems(categories, categoryDetails) {
    return categories
        .map((categoryId) => {
            const numericCategoryId = Number(categoryId);
            const rawQuantity = categoryDetails[categoryId]?.quantityKg;
            const quantityKg = Number.parseFloat(String(rawQuantity ?? '').trim());
            if (!Number.isInteger(numericCategoryId) || !Number.isFinite(quantityKg) || quantityKg <= 0) {
                return null;
            }
            return { categoryId: numericCategoryId, quantityKg };
        })
        .filter(Boolean);
}

export default function CreateReport() {
    const navigate = useNavigate();
    const formId = useId();

    const [title, setTitle] = useState('');
    const [categories, setCategories] = useState([]);
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [categoryDetails, setCategoryDetails] = useState({});
    const [reportImages, setReportImages] = useState({ files: [], previews: [] });
    const [submitting, setSubmitting] = useState(false);
    const [submitToast, setSubmitToast] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState('');
    const [districts, setDistricts] = useState([]);
    const [selectedDistrictId, setSelectedDistrictId] = useState('');
    const [selectedWardId, setSelectedWardId] = useState('');
    const [streetAddress, setStreetAddress] = useState('');

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setLoadingCategories(true);
            setCategoryError('');
            try {
                const [catData, areaData] = await Promise.all([
                    getWasteReportCategories(),
                    getCapacity()
                ]);
                
                if (!isMounted) return;
                
                const normalizedCats = catData
                    .map((item) => ({
                        id: item.id,
                        name: item.name ?? '',
                        pointsPerKg: Number(item.pointsPerKg) || 0,
                    }))
                    .filter((item) => item.id && item.name);
                setCategoryOptions(normalizedCats);
                
                setDistricts(areaData.areas || []);
            } catch (error) {
                if (!isMounted) return;
                setCategoryError(error?.message || 'Không thể tải dữ liệu ban đầu.');
            } finally {
                if (isMounted) {
                    setLoadingCategories(false);
                }
            }
        }

        loadData();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        return () => {
            reportImages.previews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [reportImages]);



    useEffect(() => {
        if (!submitToast) return undefined;

        const timer = window.setTimeout(() => {
            setSubmitToast(null);
        }, 2600);

        return () => window.clearTimeout(timer);
    }, [submitToast]);

    function toggleCategory(category) {
        setCategories((current) =>
            current.includes(category)
                ? current.filter((item) => item !== category)
                : [...current, category]
        );

        setCategoryDetails((current) => {
            const exists = Boolean(current[category]);
            if (exists) {
                const { [category]: _removed, ...rest } = current;
                return rest;
            }
            return { ...current, [category]: { quantityKg: '' } };
        });
    }

    function setCategoryQuantity(category, value) {
        setCategoryDetails((current) => ({
            ...current,
            [category]: {
                ...(current[category] ?? { quantityKg: '' }),
                quantityKg: value,
            },
        }));
    }

    function onReportImagesChange(e) {
        const incoming = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
        setReportImages((prev) => {
            prev.previews.forEach((url) => URL.revokeObjectURL(url));
            const combined = [...prev.files, ...incoming].slice(0, MAX_REPORT_IMAGES);
            return {
                files: combined,
                previews: combined.map((file) => URL.createObjectURL(file)),
            };
        });
        e.target.value = '';
    }

    function removeReportImageAt(index) {
        setReportImages((prev) => {
            const nextFiles = prev.files.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev.previews[index]);
            const nextPreviews = prev.previews.filter((_, i) => i !== index);
            return { files: nextFiles, previews: nextPreviews };
        });
    }

    async function onSubmit(e) {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        const selectedItems = getReportLineItems(categories, categoryDetails);

        if (selectedItems.length === 0) {
            setSubmitToast({
                type: 'error',
                title: 'Thiếu dữ liệu thể loại',
                message: 'Vui lòng chọn ít nhất 1 thể loại và nhập số lượng lớn hơn 0.',
            });
            return;
        }

        const totalSubmitKg = selectedItems.reduce((sum, item) => sum + item.quantityKg, 0);
        if (totalSubmitKg > MAX_REPORT_TOTAL_KG) {
            setSubmitToast({
                type: 'error',
                title: 'Vượt giới hạn khối lượng',
                message: `Tổng khối lượng không được vượt quá ${MAX_REPORT_TOTAL_KG} kg. Hiện tại: ${String(Math.round(totalSubmitKg * 10) / 10)} kg.`,
            });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                locationText: streetAddress.trim(),
                wardId: selectedWardId ? Number(selectedWardId) : null,
                wasteCategoryIds: selectedItems.map((item) => item.categoryId),
                estimatedWeightKgs: selectedItems.map((item) => item.quantityKg),
                images: reportImages.files,
            };

            await createWasteReport(payload);
            setSubmitToast({
                type: 'success',
                title: 'Tạo báo cáo thành công',
                message: 'Báo cáo của bạn đã được gửi và đang chờ xử lý.',
            });
            window.setTimeout(() => {
                navigate('/report');
            }, 700);
        } catch (error) {
            setSubmitToast({
                type: 'error',
                title: 'Tạo báo cáo thất bại',
                message: error?.message || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.',
            });
        } finally {
            setSubmitting(false);
        }
    }

    const lineItems = getReportLineItems(categories, categoryDetails);
    const totalSubmitKg = lineItems.reduce((sum, item) => sum + item.quantityKg, 0);
    const isOverWeightLimit = totalSubmitKg > MAX_REPORT_TOTAL_KG;

    const canSubmit =
        Boolean(title.trim()) &&
        Boolean(description.trim()) &&
        !submitting &&
        !isOverWeightLimit;

    const hasAnyQuantity = categories.some((category) => {
        const raw = categoryDetails[category]?.quantityKg;
        return raw !== undefined && raw !== null && String(raw).trim() !== '';
    });

    const totalQuantityKg = categories.reduce((sum, category) => {
        const raw = categoryDetails[category]?.quantityKg;
        const value = Number.parseFloat(String(raw ?? '').trim());
        return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const totalQuantityDisplay = hasAnyQuantity ? String(Math.round(totalQuantityKg * 10) / 10) : '';
    const estimatedPoints = hasAnyQuantity
        ? Math.max(
            0,
            Math.round(
                categories.reduce((sum, categoryId) => {
                    const rawQuantity = categoryDetails[categoryId]?.quantityKg;
                    const quantityKg = Number.parseFloat(String(rawQuantity ?? '').trim());
                    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
                        return sum;
                    }
                    const pointsPerKg = categoryOptions.find(
                        (option) => String(option.id) === categoryId
                    )?.pointsPerKg ?? 0;
                    return sum + quantityKg * pointsPerKg;
                }, 0)
            )
        )
        : 0;
    const estimatedPointsDisplay = hasAnyQuantity
        ? new Intl.NumberFormat('en-US').format(estimatedPoints)
        : '';
    const estimatedPointsFormulaDisplay = hasAnyQuantity
        ? categories
            .map((categoryId) => {
                const rawQuantity = categoryDetails[categoryId]?.quantityKg;
                const quantityKg = Number.parseFloat(String(rawQuantity ?? '').trim());
                if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
                    return null;
                }

                const pointsPerKg = categoryOptions.find(
                    (option) => String(option.id) === categoryId
                )?.pointsPerKg ?? 0;

                return `${quantityKg} kg × ${pointsPerKg}`;
            })
            .filter(Boolean)
            .join(' + ')
        : '';

    return (
        <div className="relative min-h-full overflow-x-hidden">
            {/* Nền chủ đề xanh lá (đồng bộ Home) */}
            <div
                className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.07] via-surface to-primary-container/[0.08]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(16,185,129,0.14),transparent_55%)]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_100%_40%,rgba(0,108,73,0.06),transparent_50%)]"
                aria-hidden
            />

            <div className="relative z-0 px-4 sm:px-6 md:px-10 py-10 sm:py-14">
                <div className="mx-auto w-full max-w-5xl space-y-6">

                    {submitToast && (
                        <div
                            role="status"
                            className={`fixed right-4 top-24 z-[80] w-[min(92vw,24rem)] rounded-2xl border px-4 py-3 shadow-xl ${submitToast.type === 'success'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                    : 'border-red-200 bg-red-50 text-red-900'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {submitToast.type === 'success' ? (
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">{submitToast.title}</p>
                                    <p className="text-xs leading-relaxed opacity-90">{submitToast.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <Link
                        to="/report"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại danh sách
                    </Link>

                    <section className="bg-surface-container-lowest rounded-[2.5rem] sm:rounded-[3rem] p-7 sm:p-10 border border-surface-container-high/60 botanical-shadow space-y-8">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 text-primary font-extrabold">
                                <PlusCircle className="w-5 h-5" />
                                <span>Tạo báo cáo mới</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-sans italic text-on-surface">
                                Báo cáo <span className="not-italic text-primary">rác thải tái chế</span>
                            </h1>
                            <p className="text-on-surface-variant max-w-2xl">
                                Điền tiêu đề, ảnh minh họa (tối đa {MAX_REPORT_IMAGES} ảnh), thể loại, địa chỉ, số lượng (khối
                                lượng ước tính) và mô tả để gửi yêu cầu thu gom.
                            </p>
                        </div>

                        <form id={formId} onSubmit={onSubmit}>
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                <div className="space-y-5 xl:col-span-9">
                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`${formId}-title`}
                                            className="flex items-center gap-2 text-sm font-bold text-on-surface"
                                        >
                                            <Type className="w-4 h-4 text-primary" />
                                            Tiêu đề <span className="text-error">*</span>
                                        </label>
                                        <input
                                            id={`${formId}-title`}
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            placeholder="VD: Nhựa và lon tại hẻm 12"
                                            className="w-full rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-shadow"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-on-surface">Hình ảnh minh họa</p>
                                        <p className="text-xs text-on-surface-variant">
                                            Tối đa {MAX_REPORT_IMAGES} ảnh (PNG, JPG). Có thể chọn nhiều lần cho đến khi đủ{' '}
                                            {MAX_REPORT_IMAGES} ảnh.
                                        </p>
                                        <label
                                            htmlFor={`${formId}-report-images`}
                                            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-surface-container-high bg-surface-container-low/40 px-3 py-4 text-center transition-colors ${reportImages.files.length >= MAX_REPORT_IMAGES
                                                ? 'cursor-not-allowed opacity-60'
                                                : 'cursor-pointer hover:border-primary/40 hover:bg-surface-container-low/70'
                                                }`}
                                        >
                                            <span className="text-sm font-semibold text-on-surface">Chọn ảnh</span>
                                            <span className="text-xs text-on-surface-variant">PNG, JPG</span>
                                            <input
                                                id={`${formId}-report-images`}
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                disabled={reportImages.files.length >= MAX_REPORT_IMAGES}
                                                onChange={onReportImagesChange}
                                                className="sr-only"
                                            />
                                        </label>
                                        {reportImages.previews.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {reportImages.previews.map((src, idx) => (
                                                    <div
                                                        key={src}
                                                        className="group relative h-20 w-20 overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-low"
                                                    >
                                                        <img src={src} alt="" className="h-full w-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeReportImageAt(idx)}
                                                            className="absolute inset-0 flex items-center justify-center bg-on-surface/55 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100"
                                                            aria-label="Xóa ảnh"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                                            <Tag className="w-4 h-4 text-primary" />
                                            Thể loại
                                        </div>
                                        <p className="text-xs text-on-surface-variant">
                                            Chọn một hoặc nhiều thể loại phù hợp với báo cáo.
                                        </p>
                                        {loadingCategories && (
                                            <p className="text-xs text-on-surface-variant">Đang tải danh sách thể loại...</p>
                                        )}
                                        {categoryError && (
                                            <p className="text-xs text-error">{categoryError}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2.5">
                                            {categoryOptions.map((category) => {
                                                const categoryKey = String(category.id);
                                                const isSelected = categories.includes(categoryKey);
                                                return (
                                                    <button
                                                        key={categoryKey}
                                                        type="button"
                                                        onClick={() => toggleCategory(categoryKey)}
                                                        aria-pressed={isSelected}
                                                        disabled={loadingCategories}
                                                        className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${isSelected
                                                            ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                                                            : 'border-surface-container-high bg-surface text-on-surface-variant hover:border-primary/40 hover:text-primary'
                                                            }`}
                                                    >
                                                        {category.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {categories.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-sm font-extrabold text-on-surface">Thông tin theo từng thể loại</p>
                                            <div className="space-y-3">
                                                {categories.map((categoryId) => {
                                                    const detail = categoryDetails[categoryId] ?? { quantityKg: '' };
                                                    const categoryName = categoryOptions.find(
                                                        (option) => String(option.id) === categoryId
                                                    )?.name ?? categoryId;
                                                    return (
                                                        <div
                                                            key={`detail-${categoryId}`}
                                                            className="rounded-3xl border border-surface-container-high/70 bg-surface-container-lowest p-4 sm:p-5 space-y-3"
                                                        >
                                                            <div className="inline-flex items-center gap-2 text-sm font-extrabold text-primary">
                                                                <Tag className="w-4 h-4" />
                                                                <span>{categoryName}</span>
                                                            </div>

                                                            <div className="rounded-2xl border border-surface-container-high bg-surface p-3 space-y-2 max-w-md">
                                                                <label
                                                                    htmlFor={`${formId}-qty-${categoryId}`}
                                                                    className="text-sm font-bold text-on-surface"
                                                                >
                                                                    Số lượng (kg)
                                                                </label>
                                                                <input
                                                                    id={`${formId}-qty-${categoryId}`}
                                                                    type="number"
                                                                    inputMode="decimal"
                                                                    min="0"
                                                                    step="0.1"
                                                                    value={detail.quantityKg}
                                                                    onChange={(e) => setCategoryQuantity(categoryId, e.target.value)}
                                                                    placeholder="VD: 3.2"
                                                                    className="w-full rounded-2xl border border-surface-container-high bg-surface px-3 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-shadow"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            Địa chỉ thu gom
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-on-surface-variant">Quận / Huyện</label>
                                                <select
                                                    value={selectedDistrictId}
                                                    onChange={(e) => {
                                                        setSelectedDistrictId(e.target.value);
                                                        setSelectedWardId('');
                                                    }}
                                                    className="w-full rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary"
                                                >
                                                    <option value="">Chọn Quận/Huyện</option>
                                                    {districts.map(d => (
                                                        <option key={d.id} value={d.id}>{d.district}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-on-surface-variant">Phường / Xã</label>
                                                <select
                                                    value={selectedWardId}
                                                    onChange={(e) => setSelectedWardId(e.target.value)}
                                                    disabled={!selectedDistrictId}
                                                    className="w-full rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary disabled:opacity-50"
                                                >
                                                    <option value="">Chọn Phường/Xã</option>
                                                    {districts.find(d => String(d.id) === String(selectedDistrictId))?.wards.map(w => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-on-surface-variant">Số nhà, tên đường, hẻm...</label>
                                            <input
                                                type="text"
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                                placeholder="VD: 123 Nguyễn Huệ, hẻm 4..."
                                                className="w-full rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-shadow"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label
                                            htmlFor={`${formId}-desc`}
                                            className="flex items-center gap-2 text-sm font-bold text-on-surface"
                                        >
                                            <FileText className="w-4 h-4 text-primary" />
                                            Mô tả <span className="text-error">*</span>
                                        </label>
                                        <textarea
                                            id={`${formId}-desc`}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            rows={4}
                                            placeholder="Mô tả ngắn vị trí đặt rác, loại vật liệu, lưu ý an toàn…"
                                            className="w-full resize-y min-h-[110px] rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary transition-shadow"
                                        />
                                    </div>
                                </div>

                                <aside className="xl:col-span-3">
                                    <div className="rounded-3xl border border-surface-container-high/70 bg-surface p-4 sm:p-5 space-y-4 xl:sticky xl:top-6">
                                        <p className="text-sm font-extrabold text-on-surface">Tổng quan báo cáo</p>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`${formId}-total-qty`}
                                                className="flex items-center gap-2 text-sm font-bold text-on-surface"
                                            >
                                                <Tag className="w-4 h-4 text-primary" />
                                                Tổng khối lượng
                                            </label>
                                            <input
                                                id={`${formId}-total-qty`}
                                                type="text"
                                                value={totalQuantityDisplay}
                                                readOnly
                                                placeholder="Tự động tính"
                                                className="w-full rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
                                            />
                                            <p className="text-xs text-on-surface-variant">
                                                Đơn vị: kg · Tối đa {MAX_REPORT_TOTAL_KG} kg (tổng các thể loại có số lượng hợp lệ)
                                            </p>
                                            {isOverWeightLimit && (
                                                <p className="text-xs font-semibold text-error">
                                                    Tổng khối lượng vượt quá {MAX_REPORT_TOTAL_KG} kg — vui lòng giảm số lượng để gửi báo cáo.
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label
                                                htmlFor={`${formId}-estimated-points`}
                                                className="flex items-center gap-2 text-sm font-bold text-on-surface"
                                            >
                                                <Star className="w-4 h-4 text-primary" fill="currentColor" />
                                                Điểm thưởng dự kiến
                                            </label>
                                            <input
                                                id={`${formId}-estimated-points`}
                                                type="text"
                                                value={estimatedPointsDisplay}
                                                readOnly
                                                placeholder="Tự động tính"
                                                className="w-full rounded-2xl border border-surface-container-high bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
                                            />
                                            <p className="text-xs text-on-surface-variant">
                                                Cách tính: {estimatedPointsFormulaDisplay || 'Số kg × PointPerKg'}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3 pt-1">
                                            <Link
                                                to="/report"
                                                className="inline-flex items-center justify-center rounded-2xl border border-surface-container-high px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                            >
                                                Hủy
                                            </Link>
                                            <button
                                                type="submit"
                                                disabled={!canSubmit}
                                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-container disabled:opacity-50 disabled:pointer-events-none text-white px-6 py-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.99]"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Đang gửi…
                                                    </>
                                                ) : (
                                                    'Gửi báo cáo'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
}
