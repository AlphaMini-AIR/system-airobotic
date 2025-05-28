'use client';

import { useState } from 'react';

export default function CommentForm({ student, initialComment, onSave, onCancel }) {
    const [comment, setComment] = useState(initialComment);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    
    const commentTemplates = [
        'Học sinh chăm chỉ, tích cực tham gia lớp học',
        'Cần cải thiện thái độ học tập',
        'Thường xuyên đi muộn, cần lưu ý về thời gian',
        'Tham gia tích cực các hoạt động nhóm',
        'Cần hỗ trợ thêm về kiến thức cơ bản',
        'Có tinh thần trách nhiệm cao',
        'Cần cải thiện kỹ năng giao tiếp',
        'Hoàn thành tốt các bài tập được giao',
        'Thể hiện khả năng sáng tạo trong học tập',
        'Cần tăng cường tương tác với bạn học'
    ];
    
    const handleTemplateSelect = (template) => {
        setComment(prev => prev ? `${prev}\n${template}` : template);
        setSelectedTemplate('');
    };
    
    const handleSave = () => {
        onSave(comment.trim());
    };
    
    return (
        <div style={{ padding: '16px', minWidth: '500px' }}>
            {/* Thông tin học sinh */}
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #e9ecef'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div><strong>Mã học sinh:</strong> {student?.ID}</div>
                    <div><strong>Họ tên:</strong> {student?.Name}</div>
                </div>
            </div>
            
            {/* Mẫu nhận xét */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#495057'
                }}>
                    Chọn mẫu nhận xét:
                </label>
                <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                    }}
                >
                    <option value="">-- Chọn mẫu nhận xét --</option>
                    {commentTemplates.map((template, index) => (
                        <option key={index} value={template}>{template}</option>
                    ))}
                </select>
                
                {selectedTemplate && (
                    <button
                        onClick={() => handleTemplateSelect(selectedTemplate)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                    >
                        ✓ Thêm vào nhận xét
                    </button>
                )}
            </div>
            
            {/* Ô nhập nhận xét */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600',
                    color: '#495057'
                }}>
                    Nhận xét chi tiết:
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Nhập nhận xét chi tiết cho học sinh..."
                    style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        lineHeight: '1.5'
                    }}
                />
                <div style={{ 
                    fontSize: '12px', 
                    color: '#6c757d', 
                    marginTop: '4px' 
                }}>
                    {comment.length} ký tự
                </div>
            </div>
            
            {/* Nút hành động */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e9ecef'
            }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                    Hủy
                </button>
                <button
                    onClick={handleSave}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                >
                    Lưu nhận xét
                </button>
            </div>
        </div>
    );
}
