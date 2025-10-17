# Chức Năng Phóng To Ảnh

## Tổng Quan
Chức năng phóng to ảnh đã được thêm vào cả trang Business và Product Detail Modal. **Chỉ ảnh chính (main image) mới có thể phóng to**, các thumbnail chỉ dùng để chuyển đổi ảnh chính. Ảnh phóng to hiển thị với kích thước vừa phải (70% viewport).

## Tính Năng

### 1. ImageZoomModal Component
- **Vị trí**: `frontend/src/components/ImageZoomModal.jsx`
- **CSS**: `frontend/src/css/ImageZoomModal.css`
- **Chức năng**:
  - Phóng to ảnh với animation mượt mà
  - **Ảnh hiển thị nhỏ hơn** (70% viewport thay vì 90%)
  - Loading spinner khi đang tải ảnh
  - Đóng bằng cách click vào backdrop
  - Hỗ trợ phím Escape để đóng
  - Responsive design cho mobile
  - Z-index cao để hiển thị trên tất cả elements khác

### 2. BusinessPage
- **Vị trí**: `frontend/src/page/user/BusinessPage.jsx`
- **Chức năng**:
  - **Phóng to ảnh chính của business** (main image)
  - **Ảnh sản phẩm trong carousel KHÔNG có chức năng phóng to**
  - Thumbnail images chỉ dùng để chuyển đổi ảnh chính

### 3. ProductDetailModal
- **Vị trí**: `frontend/src/components/ProductDetailModal.jsx`
- **Chức năng**:
  - **Phóng to ảnh chính của sản phẩm** (main image) - chỉ khi vào modal chi tiết
  - Thumbnail images chỉ dùng để chuyển đổi ảnh chính

## Cách Sử Dụng

### Cho Người Dùng:
1. **Phóng to ảnh business**: Click vào **ảnh chính** (main image) có cursor `zoom-in`
2. **Phóng to ảnh sản phẩm**: 
   - Click "Xem chi tiết" để mở modal
   - Trong modal, click vào **ảnh chính** của sản phẩm
3. **Chuyển đổi ảnh**: Click vào **thumbnail** để thay đổi ảnh chính
4. **Đóng phóng to**: 
   - Click vào vùng tối xung quanh ảnh
   - Nhấn phím Escape

### Cho Developer:
```jsx
// Import component
import ImageZoomModal from '../../components/ImageZoomModal';

// State management
const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
const [zoomedImageUrl, setZoomedImageUrl] = useState('');

// Handle zoom (chỉ cho main image)
const handleImageZoom = (imageUrl) => {
  setZoomedImageUrl(imageUrl);
  setIsImageZoomOpen(true);
};

const closeImageZoom = () => {
  setIsImageZoomOpen(false);
  setZoomedImageUrl('');
};

// Main image - có thể phóng to
<img 
  src={imageUrl}
  style={{ cursor: 'zoom-in' }}
  onClick={() => handleImageZoom(imageUrl)}
/>

// Thumbnail - chỉ dùng để chuyển đổi
<img 
  src={thumbnailUrl}
  onClick={() => setSelectedImage(index)}
/>

// Ảnh sản phẩm trong carousel - KHÔNG có chức năng phóng to
<img 
  src={productImage}
  alt={productName}
/>

// Render modal
<ImageZoomModal
  isOpen={isImageZoomOpen}
  imageUrl={zoomedImageUrl}
  onClose={closeImageZoom}
  imageAlt="Mô tả ảnh"
/>
```

## CSS Classes

### ImageZoomModal
- `.image-zoom-backdrop`: Background overlay
- `.image-zoom-content`: Container cho ảnh phóng to
- `.zoomed-image`: Ảnh được phóng to
- `.image-loading`: Container cho loading spinner
- `.loading-spinner`: Spinner animation

### Hover Effects (chỉ cho main image)
- `.main-img:hover`: Hiệu ứng hover cho ảnh chính
- `.product-main-image img:hover`: Hiệu ứng hover cho ảnh sản phẩm (chỉ trong modal)

## Responsive Design
- **Desktop**: Ảnh phóng to tối đa 70% viewport
- **Tablet**: Ảnh phóng to tối đa 85% viewport
- **Mobile**: Ảnh phóng to tối đa 90% viewport

## Browser Support
- Chrome, Firefox, Safari, Edge
- Hỗ trợ touch events cho mobile
- Fallback cho ảnh lỗi
- Keyboard accessibility (Escape key)

## Performance
- Sử dụng React Portal để render modal
- Loading spinner khi tải ảnh
- Optimized animations với Framer Motion
- Memory cleanup khi đóng modal

## Cải Tiến Mới
- **Ảnh nhỏ hơn**: Hiển thị 70% viewport thay vì 90% để dễ nhìn hơn
- **Ảnh sản phẩm**: Chỉ phóng to được trong modal chi tiết
- **Loading spinner**: Hiển thị khi đang tải ảnh
- **Smooth transitions**: Hiệu ứng mượt mà khi ảnh load xong

## Lưu Ý
- **Chỉ ảnh chính mới có thể phóng to**
- Thumbnail images chỉ dùng để chuyển đổi ảnh chính
- **Ảnh sản phẩm trong carousel KHÔNG có chức năng phóng to**
- Cursor `zoom-in` chỉ hiển thị trên ảnh có thể phóng to
- **Đóng bằng cách click backdrop hoặc nhấn ESC** 