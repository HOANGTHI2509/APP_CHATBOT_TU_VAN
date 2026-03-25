import os
import hashlib
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

PDF_DIR = r"C:\Users\Admin\Downloads\BOTCHAT\PDF"
CHROMA_DIR = "./chroma_db"

print("🔥 BƯỚC 1: XÓA SẠCH NÃO BỘ CŨ BỊ NHIỄM ĐỘC...")

embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY, model="text-embedding-3-small")

try:
    vectorstore_old = Chroma(persist_directory=CHROMA_DIR, collection_name="BOTCHAT", embedding_function=embeddings)
    vectorstore_old.delete_collection()
    print("✅ Đã xóa sạch dữ liệu cũ.")
except Exception as e:
    print(f"⚠️ Dữ liệu cũ đã trống hoặc không thể xóa: {e}")

print("\n🔥 BƯỚC 2: BẮT ĐẦU ĐỒNG BỘ NÂNG CẤP (CHỐNG TRÙNG LẶP) 🔥")

# Tạo mới collection sạch
vectorstore = Chroma(
    persist_directory=CHROMA_DIR,
    collection_name="BOTCHAT", 
    embedding_function=embeddings
)

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

count = 0
seen_hashes = set()

# Dọn dẹp sơ bộ file rác (Clean files physically)
print("Đang quét file rác trong thư mục PDF...")
target_keywords = ["_cleaned", "_cleaned_cleaned"]
def get_clean_basename(filename):
    base = filename.replace(".txt", "")
    while "_cleaned" in base:
        base = base.replace("_cleaned", "")
    return base

files_by_base = {}

for filename in os.listdir(PDF_DIR):
    if filename.endswith(".txt"):
        base = get_clean_basename(filename)
        if base not in files_by_base:
            files_by_base[base] = []
        files_by_base[base].append(filename)

# Chỉ lấy 1 file duy nhất (ưu tiên file có chữ _cleaned ít nhất)
files_to_ingest = []
for base, files in files_by_base.items():
    files.sort(key=len) # file ngắn nhất (không có _cleaned_cleaned) đứng đầu
    files_to_ingest.append(files[0])
    
    # Xoá các file copy còn lại
    for trash_file in files[1:]:
        trash_path = os.path.join(PDF_DIR, trash_file)
        try:
            os.remove(trash_path)
            print(f"  🗑️ Đã xóa file rác: {trash_file}")
        except:
            pass

# Nạp dữ liệu với hệ thống Hash
for filename in files_to_ingest:
    filepath = os.path.join(PDF_DIR, filename)
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
            
    if len(text.strip()) < 10:
        continue
            
    # Băm nhỏ chữ để lấy "dấu vân tay"
    text_hash = hashlib.md5(text.encode("utf-8")).hexdigest()
        
    if text_hash in seen_hashes:
        print(f"⚠️ Bỏ qua file Nội dung trùng lặp: {filename}")
        continue
            
    seen_hashes.add(text_hash)
            
    print(f"Đang phân tích file GỐC: {filename}...")
    chunks = splitter.split_text(text)
    metadatas = [{"source": filename}] * len(chunks)
    vectorstore.add_texts(texts=chunks, metadatas=metadatas)
    count += 1
    print(f"  -> Nạp thành công {len(chunks)} đoạn bộ nhớ!")

print(f"\n✅ HOÀN TẤT! Đã dọn dẹp thư mục và nạp cực chuẩn {count} file tài liệu độc nhất vào AI.")
