import random


def sayi_tahmin_oyunu():
    print("--- Sayı Tahmin Oyununa Hoş Geldin! ---")
    tutulan_sayi = random.randint(1, 100)
    tahmin_hakki = 5

    while tahmin_hakki > 0:
        try:
            tahmin = int(input(f"1 ile 100 arasında bir sayı gir ({tahmin_hakki} hakkın kaldı): "))
        except ValueError:
            print("Lütfen geçerli bir sayı gir!")
            continue

        if tahmin == tutulan_sayi:
            print("Tebrikler! Oyunu kazandın! 🏆")
            break
        elif tahmin < tutulan_sayi:
            print("Daha büyük bir sayı söyle ⬆️")
        else:
            print("Daha küçük bir sayı söyle ⬇️")

        tahmin_hakki -= 1
    else:
        print(f"Üzgünüm, hakkın bitti. Tutulan sayı: {tutulan_sayi} 😢")


# Oyunu başlatmak için:
if __name__ == "__main__":
    sayi_tahmin_oyunu()
