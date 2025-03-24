from PIL import Image
import os
import sys

def resize_image(input_path, output_folder, sizes=[72, 96, 128, 144, 152, 192, 384, 512]):
    try:
        # Ouvrir l'image
        img = Image.open(input_path)
        
        # Créer le dossier de sortie s'il n'existe pas
        os.makedirs(output_folder, exist_ok=True)
        
        # Obtenir le nom de fichier sans extension
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        
        # Redimensionner et sauvegarder les images
        for size in sizes:
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            output_path = os.path.join(output_folder, f"{base_name}_{size}x{size}.png")
            resized_img.save(output_path, "PNG")
            print(f"✅ Image enregistrée : {output_path}")
        
        print("🎉 Toutes les tailles ont été générées avec succès !")
    except Exception as e:
        print(f"❌ Erreur : {e}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python resize_icons.py public/icons/iconOriginal.png")
    else:
        input_image = sys.argv[1]
        resize_image(input_image, "icons")
